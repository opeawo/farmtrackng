// Pull recent Nigerian poultry market prices from the Poultry Plaza Facebook
// page via Gemini Flash with the Google Search grounding tool.
//
// Facebook blocks direct server-side fetching, so we let Gemini search
// Google's index of public Poultry Plaza posts. Each post typically lists
// multiple price points (broilers, layers, eggs, feed) for a given date and
// market — we extract them as individual MarketListing entries so they merge
// cleanly with the Jiji feed.

import { GoogleGenAI } from '@google/genai';
import { env } from '$env/dynamic/private';
import { extractJsonBlock, normaliseListing } from './shared';
import type { MarketListing } from './types';

const { GEMINI_API_KEY, GEMINI_MODEL } = env;
const MODEL = GEMINI_MODEL || 'gemini-flash-latest';
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const SEARCH_PROMPT = `Find the most recent Nigerian poultry market price posts from the Poultry Plaza Facebook page at https://www.facebook.com/poultryplaza. Cover posts from the last 30 days where possible.

Use Google web search to surface real public posts. Each post often lists multiple price points (e.g. broilers, layers, day-old chicks, point-of-lay birds, table eggs, feed) for a specific date and market — extract each price point as its OWN entry.

For each price point capture:
- title (what the price is for, e.g. "Broiler, live weight", "Crate of large eggs", "20kg layer feed")
- priceNgn (Naira, integer; use the low end of any range)
- unit (per bird, per kg, per crate, per bag, "each" — leave empty if not stated)
- location (the market or city the price was quoted for, e.g. "Lagos · Oyingbo")
- postedAt (the date the post was published, in YYYY-MM-DD or as written)
- url (the FULL https://www.facebook.com/... post URL)
- category (one of: poultry, cattle, goat, sheep, pig, fish, feed, eggs, other)

Return ONLY a single JSON object — no commentary, no markdown fences:

{ "listings": [ { "title": "...", "priceNgn": 0, "unit": "...", "location": "...", "postedAt": "...", "url": "https://www.facebook.com/...", "category": "..." } ] }

Hard rules:
- Use only price points you can verify in real Poultry Plaza posts via web search; do not fabricate.
- Skip any price under 100 Naira (those are placeholders).
- Skip duplicates across posts; if the same market has the same price on the same day in two posts, keep one.
- The url MUST be an actual facebook.com/poultryplaza post URL.
- If you cannot find real posts, return { "listings": [] }.
- Up to 20 price points total.`;

export async function fetchPoultryPlazaListings(): Promise<MarketListing[]> {
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
				source: 'poultry-plaza',
				urlHostPattern: /^https?:\/\/(?:www\.)?facebook\.com\/(?:poultryplaza|.*)/i,
				urlPrefix: 'https://www.facebook.com'
			})
		)
		.filter((l): l is MarketListing => l !== null);

	return listings;
}
