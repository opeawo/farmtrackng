// Pull recent Nigerian livestock-and-poultry prices via Gemini Flash with the
// Google Search grounding tool enabled. Direct scraping of jiji.ng is blocked
// at the CDN (Cloudflare returns 403 to server-side fetches), but Gemini can
// search Google's index of Jiji and other sources and return grounded data.
//
// Cost: one Gemini call with search tool enabled (~$0.035 in Vertex pricing,
// negligible on Developer API). Cached for 24h per Vercel instance.

import { GoogleGenAI } from '@google/genai';
import { env } from '$env/dynamic/private';

const { GEMINI_API_KEY, GEMINI_MODEL } = env;
const MODEL = GEMINI_MODEL || 'gemini-flash-latest';
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const SOURCE_URL = 'https://jiji.ng/livestock-and-poultry';

export interface JijiListing {
	title: string;
	priceNgn: number;
	location: string;
	postedAt: string;
	url: string;
	category: 'poultry' | 'cattle' | 'goat' | 'sheep' | 'pig' | 'fish' | 'other';
}

export interface FetchResult {
	listings: JijiListing[];
	source: string;
	fetchedAt: string;
}

const SEARCH_PROMPT = `Find current Nigerian livestock and poultry classified listings on https://jiji.ng/livestock-and-poultry posted in the last 30 days.

Search the web for real listings and extract up to 20 of the freshest ones. For each, capture:
- title (as listed)
- priceNgn (Naira, as an integer — use the low end if a range)
- location (state, plus area/LGA if shown, formatted as "State · Area")
- postedAt (the date or relative date as shown)
- url (the full https://jiji.ng/... listing URL)
- category (one of: poultry, cattle, goat, sheep, pig, fish, other)

Return ONLY a single JSON object in this exact shape, with no commentary or markdown fences:

{ "listings": [ { "title": "...", "priceNgn": 0, "location": "...", "postedAt": "...", "url": "https://jiji.ng/...", "category": "..." } ] }

Hard rules:
- Use only listings you can actually find via web search; do not fabricate.
- Skip any listing without a numeric price, or with a price under 100 Naira (those are placeholders).
- Skip duplicates and skip non-livestock items.
- Prefer the freshest listings.
- The url MUST be an actual jiji.ng listing URL you found in search results.
- If you cannot find real listings, return { "listings": [] }.`;

export async function fetchJijiListings(): Promise<FetchResult> {
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
	if (!jsonText) {
		throw new Error('Gemini returned no parseable JSON');
	}

	let parsed: { listings?: Partial<JijiListing>[] };
	try {
		parsed = JSON.parse(jsonText);
	} catch {
		throw new Error('Gemini returned malformed JSON');
	}

	const listings: JijiListing[] = (parsed.listings ?? [])
		.map(normaliseListing)
		.filter((l): l is JijiListing => l !== null);

	return {
		listings,
		source: SOURCE_URL,
		fetchedAt: new Date().toISOString()
	};
}

// Grounded responses sometimes wrap JSON in markdown fences or include
// trailing citation footnotes. Pull out the first balanced { ... } block.
function extractJsonBlock(text: string): string | null {
	const fenceMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
	if (fenceMatch) return fenceMatch[1];

	const start = text.indexOf('{');
	if (start === -1) return null;
	let depth = 0;
	for (let i = start; i < text.length; i++) {
		const ch = text[i];
		if (ch === '{') depth++;
		else if (ch === '}') {
			depth--;
			if (depth === 0) return text.slice(start, i + 1);
		}
	}
	return null;
}

function normaliseListing(raw: Partial<JijiListing>): JijiListing | null {
	if (!raw.title || typeof raw.title !== 'string') return null;
	if (typeof raw.priceNgn !== 'number' || !Number.isFinite(raw.priceNgn) || raw.priceNgn < 100) {
		return null;
	}
	if (!raw.location || typeof raw.location !== 'string') return null;
	if (!raw.url || typeof raw.url !== 'string') return null;

	let url = raw.url.trim();
	if (url.startsWith('/')) url = `https://jiji.ng${url}`;
	if (!url.startsWith('http')) url = `https://${url}`;
	// Only trust jiji.ng URLs to keep clicks on the cited source.
	if (!/^https?:\/\/(?:[^/]+\.)?jiji\.ng\//i.test(url)) return null;

	const allowed: JijiListing['category'][] = [
		'poultry',
		'cattle',
		'goat',
		'sheep',
		'pig',
		'fish',
		'other'
	];
	const category =
		raw.category && allowed.includes(raw.category as JijiListing['category'])
			? (raw.category as JijiListing['category'])
			: 'other';

	return {
		title: raw.title.trim().slice(0, 200),
		priceNgn: Math.round(raw.priceNgn),
		location: raw.location.trim().slice(0, 100),
		postedAt: (raw.postedAt ?? '').trim().slice(0, 60) || 'Recently',
		url,
		category
	};
}
