// Pull recent Nigerian livestock-and-poultry classified listings from jiji.ng
// via Gemini Flash with the Google Search grounding tool.
//
// Direct scraping of jiji.ng is blocked at the CDN (returns 403 to server-side
// fetches), so we let Gemini search Google's index of Jiji instead. No
// scraping, source still credited per listing.

import { GoogleGenAI } from '@google/genai';
import { env } from '$env/dynamic/private';
import { extractJsonBlock, normaliseListing } from './shared';
import type { MarketListing } from './types';

const { GEMINI_API_KEY, GEMINI_MODEL } = env;
const MODEL = GEMINI_MODEL || 'gemini-flash-latest';
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const SEARCH_PROMPT = `Find current Nigerian livestock and poultry classified listings on https://jiji.ng/livestock-and-poultry posted in the last 30 days.

Use Google web search to find real listings. Extract up to 20 of the freshest ones. For each, capture:
- title (as listed)
- priceNgn (Naira, as an integer — use the low end if a range)
- unit (per bird, per kg, per crate, per bag, "each" — leave empty if not stated)
- location (state, plus area/LGA if shown, formatted as "State · Area")
- postedAt (the date or relative date as shown)
- url (the FULL https://jiji.ng/... listing URL)
- category (one of: poultry, cattle, goat, sheep, pig, fish, feed, eggs, other)

Return ONLY a single JSON object — no commentary, no markdown fences:

{ "listings": [ { "title": "...", "priceNgn": 0, "unit": "...", "location": "...", "postedAt": "...", "url": "https://jiji.ng/...", "category": "..." } ] }

Hard rules:
- Use only listings you can verify via web search; do not fabricate.
- Skip any listing without a numeric price, or with a price under 100 Naira.
- Skip duplicates and non-livestock items.
- Prefer the freshest listings.
- The url MUST be an actual jiji.ng listing URL.
- If you cannot find real listings, return { "listings": [] }.`;

export async function fetchJijiListings(): Promise<MarketListing[]> {
	const response = await ai.models.generateContent({
		model: MODEL,
		contents: [{ role: 'user', parts: [{ text: SEARCH_PROMPT }] }],
		config: {
			tools: [{ googleSearch: {} }],
			temperature: 0,
			maxOutputTokens: 4096
		}
	});

	const text = (response.text ?? '').trim();
	const jsonText = extractJsonBlock(text);
	if (!jsonText) throw new Error('Gemini returned no parseable JSON');

	let parsed: { listings?: unknown[] };
	try {
		parsed = JSON.parse(jsonText) as { listings?: unknown[] };
	} catch {
		throw new Error('Gemini returned malformed JSON');
	}

	const listings = (parsed.listings ?? [])
		.map((raw) =>
			normaliseListing(raw, {
				source: 'jiji',
				urlHostPattern: /^https?:\/\/(?:[^/]+\.)?jiji\.ng\//i,
				urlPrefix: 'https://jiji.ng'
			})
		)
		.filter((l): l is MarketListing => l !== null);

	return listings;
}
