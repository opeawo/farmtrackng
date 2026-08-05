import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GoogleGenAI, Type, type Part } from '@google/genai';
import { env } from '$env/dynamic/private';
const { GEMINI_API_KEY, GEMINI_MODEL } = env;
import { diseases } from '$lib/data/diseases';
import { livestockTypes } from '$lib/data/livestock-types';
import { nigerianStates } from '$lib/data/markets';
import { SYSTEM_PROMPT } from '$lib/server/ai/persona';
import * as marketCache from '$lib/server/markets/cache';
import { fetchAggregatedPrices } from '$lib/server/markets/aggregate';
import type { AggregatedPrice } from '$lib/server/markets/types';

// Mirrors the cache payload written by /api/markets/prices.
const MARKETS_CACHE_KEY = 'markets:index';
const MARKETS_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_PRICE_ROWS = 30;
interface MarketIndexCache {
	fetchedAt: string;
	prices: AggregatedPrice[];
	degraded: boolean;
}

// Pull the FarmPaddy Market Price Index for every AI call. Same in-memory
// cache the /api/markets/prices endpoint uses; on cold cache (fresh Vercel
// instance) we read the Google Sheet ourselves so the AI always has data to
// ground on. Subsequent calls within 24h hit the warm cache.
async function ensureMarketCacheWarm(): Promise<MarketIndexCache | null> {
	const existing = marketCache.get<MarketIndexCache>(MARKETS_CACHE_KEY);
	if (existing && !marketCache.isExpired(existing)) {
		console.log(
			`[api/ai/query] price cache hit: ${existing.data.prices.length} rows, fetched ${existing.data.fetchedAt}`
		);
		return existing.data;
	}
	try {
		const { prices, degraded } = await fetchAggregatedPrices();
		console.log(
			`[api/ai/query] price cache warm: fetched ${prices.length} rows, degraded=${degraded}`
		);
		if (prices.length > 0) {
			const data: MarketIndexCache = {
				fetchedAt: new Date().toISOString(),
				prices,
				degraded
			};
			marketCache.set<MarketIndexCache>(MARKETS_CACHE_KEY, data, MARKETS_TTL_MS);
			return data;
		}
	} catch (err) {
		// Sheet fetch failed — leave the cache as-is so the AI gracefully
		// reports no current price data per the persona rules.
		console.warn('[api/ai/query] price cache warm failed', err);
	}
	return existing?.data ?? null;
}

const MODEL = GEMINI_MODEL || 'gemini-flash-latest';

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

interface AiQueryBody {
	question?: string;
	species?: string;
	state?: string;
	imageDataUrl?: string;
}

interface AiQueryResult {
	answer: string;
	severity: 'monitor' | 'treat' | 'urgent' | null;
	drugMentioned: boolean;
	priceInfo: string | null;
	sources: string[];
}

const RESPONSE_SCHEMA = {
	type: Type.OBJECT,
	properties: {
		answer: { type: Type.STRING },
		severity: { type: Type.STRING, nullable: true, enum: ['monitor', 'treat', 'urgent'] },
		drugMentioned: { type: Type.BOOLEAN },
		priceInfo: { type: Type.STRING, nullable: true },
		sources: { type: Type.ARRAY, items: { type: Type.STRING } }
	},
	required: ['answer', 'drugMentioned', 'sources'],
	propertyOrdering: ['answer', 'severity', 'drugMentioned', 'priceInfo', 'sources']
};

function buildContext(species?: string, state?: string): string {
	const relevantDiseases = species
		? diseases.filter((d) => d.livestockTypes.includes(species))
		: diseases;

	const diseaseLines = relevantDiseases
		.map((d) => `- ${d.name} (${d.severity}): symptoms — ${d.symptoms.join(', ')}. First aid: ${d.firstAid}`)
		.join('\n');

	const speciesInfo = species
		? livestockTypes.find((t) => t.id === species)
		: null;
	const speciesLine = speciesInfo
		? `Species: ${speciesInfo.name}. Common Nigerian breeds: ${speciesInfo.breeds.join(', ')}. Common diseases: ${speciesInfo.commonDiseases.join(', ')}.`
		: 'Species: not specified.';

	const relevantState = state
		? nigerianStates.find((s) => s.name.toLowerCase() === state.toLowerCase())
		: null;
	const marketsLine = relevantState
		? `${relevantState.name} major livestock markets: ${relevantState.majorMarkets.join('; ')}.`
		: `Nigerian livestock market hubs include: ${nigerianStates
				.slice(0, 6)
				.map((s) => `${s.name} (${s.majorMarkets[0] ?? 'major market'})`)
				.join('; ')}.`;

	const pricesBlock = buildMarketPricesBlock(state);

	return `BACKGROUND KNOWLEDGE
${speciesLine}

Known diseases relevant to this question:
${diseaseLines}

Markets context:
${marketsLine}${pricesBlock}`;
}

// Read the FarmPaddy Market Price Index from the in-memory cache and format
// it into a context block the model MUST use for any price question. The
// block is always emitted (even if empty) with an explicit instruction so
// the model never tries to substitute its own memory.
function buildMarketPricesBlock(state?: string): string {
	const entry = marketCache.get<MarketIndexCache>(MARKETS_CACHE_KEY);
	const userState = state?.trim();

	// Cache miss entirely — tell the model explicitly that the index is
	// unavailable so it can give a graceful, non-hallucinated reply.
	if (!entry || !entry.data || entry.data.prices.length === 0) {
		console.log(`[api/ai/query] price block: index unavailable`);
		return `

RECENT MARKET PRICES (FarmPaddy index from field-agent data — every commodity in its fixed market unit: per bird, per head, per crate of 30, per 25kg bag, per kg…)
The price index is not available right now. If the farmer asks about a price, tell them honestly that the live index is temporarily unavailable and suggest they check the Market Prices page in a few minutes.`;
	}

	const { fetchedAt, prices, degraded } = entry.data;

	// Order rows: requested state first (so price questions land on it), then
	// the rest by sample size for breadth. Cap at MAX_PRICE_ROWS total so
	// token cost stays bounded.
	const stateRows = userState
		? prices.filter((p) => p.state.toLowerCase() === userState.toLowerCase())
		: [];
	const otherRows = prices
		.filter((p) => !userState || p.state.toLowerCase() !== userState.toLowerCase())
		.sort((a, b) => b.sampleSize - a.sampleSize);
	const rows = [...stateRows, ...otherRows].slice(0, MAX_PRICE_ROWS);

	const scopeNote = userState
		? stateRows.length > 0
			? `User is in ${userState}. ${stateRows.length} row(s) for ${userState} listed first; remaining rows are other states as comparable reference.`
			: `User is in ${userState}, but the index has no rows for ${userState} yet. Other states are shown as a comparable reference — quote those with the explicit caveat that they are not the user's state.`
		: `Top rows across Nigeria, ordered by sample size.`;

	const header = `

RECENT MARKET PRICES (FarmPaddy index from field-agent data — every commodity in its fixed market unit: per bird, per head, per crate of 30, per 25kg bag, per kg…)
Last refreshed: ${fetchedAt}${degraded ? ' — thin dataset, treat as low confidence' : ''}
${scopeNote}

RULES FOR PRICE QUESTIONS:
- USE this table. Do NOT refuse a price question while there are rows in it.
- Quote the figure with its unit exactly as given in the row (each commodity has one fixed unit — never convert or re-state it in another unit), the low–high range when given, the confidence, and the state.
- If the user's exact livestock isn't in the user's state, use the closest comparable category in that state (e.g. broiler ⇄ poultry, ram ⇄ sheep), and say so plainly.
- If neither exact nor close match exists in the user's state, quote rows from other states and label them clearly as out-of-state references.
- This is FarmPaddy's own modeled estimate — never name a third-party site as the source.
- End every price answer reminding the farmer to confirm with a local seller before relying on it.`;

	const lines = rows.map((p) => {
		const range =
			p.lowNgn !== undefined && p.highNgn !== undefined
				? ` (range ₦${p.lowNgn.toLocaleString('en-NG')}–₦${p.highNgn.toLocaleString('en-NG')})`
				: '';
		return `- ${p.product} (${p.category}, ${p.state}): ₦${p.priceNgn.toLocaleString('en-NG')} ${p.unit}${range}, confidence ${p.confidence}%, ${p.sampleSize} samples`;
	});

	console.log(
		`[api/ai/query] price block: ${rows.length} rows (${stateRows.length} for state=${userState ?? '∅'})`
	);
	return `${header}
${lines.join('\n')}`;
}

function parseImageDataUrl(dataUrl: string): { mimeType: string; data: string } | null {
	const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
	if (!match) return null;
	return { mimeType: match[1], data: match[2] };
}

export const POST: RequestHandler = async ({ request }) => {
	let body: AiQueryBody;
	try {
		body = (await request.json()) as AiQueryBody;
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	const question = (body.question ?? '').trim();
	if (!question && !body.imageDataUrl) {
		return json({ error: 'Please type a question or attach a photo.' }, { status: 400 });
	}

	// Always pull the latest market index so the model has prices to ground on
	// regardless of whether /markets has been visited first. ~1 Sheets fetch
	// per Vercel instance per 24h; everything else hits the in-memory cache.
	await ensureMarketCacheWarm();

	const context = buildContext(body.species, body.state);
	console.log(
		`[api/ai/query] state=${body.state ?? '∅'} contextChars=${context.length}`
	);

	const parts: Part[] = [
		{ text: `${context}\n\nFARMER QUESTION:\n${question || '(no text, see attached photo)'}` }
	];

	if (body.imageDataUrl) {
		const image = parseImageDataUrl(body.imageDataUrl);
		if (image) parts.push({ inlineData: image });
	}

	try {
		const response = await ai.models.generateContent({
			model: MODEL,
			contents: [{ role: 'user', parts }],
			config: {
				systemInstruction: SYSTEM_PROMPT,
				responseMimeType: 'application/json',
				responseSchema: RESPONSE_SCHEMA,
				temperature: 0.4
			}
		});

		const raw = response.text ?? '{}';
		let parsed: Partial<AiQueryResult> = {};
		try {
			parsed = JSON.parse(raw) as Partial<AiQueryResult>;
		} catch {
			return json(
				{ error: 'The AI returned an unreadable response. Please try again.' },
				{ status: 502 }
			);
		}

		const severity = parsed.severity;
		const result: AiQueryResult = {
			answer: parsed.answer ?? 'Please consult a registered veterinarian.',
			severity:
				severity === 'monitor' || severity === 'treat' || severity === 'urgent'
					? severity
					: null,
			drugMentioned: Boolean(parsed.drugMentioned),
			priceInfo:
				typeof parsed.priceInfo === 'string' && parsed.priceInfo.length > 0
					? parsed.priceInfo
					: null,
			sources: Array.isArray(parsed.sources) ? parsed.sources.slice(0, 4).map(String) : []
		};

		return json(result);
	} catch (err) {
		console.error('[api/ai/query] Gemini call failed', err);
		return json(
			{ error: 'The AI is unavailable right now. Please try again in a moment.' },
			{ status: 500 }
		);
	}
};
