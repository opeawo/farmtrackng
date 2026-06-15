// Aggregate raw field-agent price entries into FarmPaddy's modeled price index.
//
// The agent intake (Google Sheet) is the only source. We feed the raw entries
// to Gemini, which groups them by livestock type + state, drops outliers,
// down-weights stale entries, fills thin states with reasonable estimates, and
// returns a representative price per kg with a confidence score. The output
// carries no source identity — it is presented as FarmPaddy's own index.

import { GoogleGenAI } from '@google/genai';
import { env } from '$env/dynamic/private';
import { getPriceRows, type PriceRow } from './sheets';
import { extractJsonBlock, normaliseAggregate } from './shared';
import type { AggregatedPrice } from './types';

const MODEL = env.GEMINI_MODEL || 'gemini-flash-latest';

function buildPrompt(rows: PriceRow[]): string {
	const data = rows.map((r) => ({
		product: r.product,
		state: r.state,
		market: r.market,
		priceNgnPerKg: r.priceNgn,
		date: r.timestampWat
	}));

	return `You are FarmPaddy's livestock pricing engine. Below are raw price entries (Naira per kg) collected by FarmPaddy field agents across Nigeria.

DATA:
${JSON.stringify(data)}

Produce a clean aggregated price index. Rules:
- Group entries by the SAME livestock/product type and the SAME state.
- For each group, compute a representative priceNgn (per kg): use a robust central value (median-like), discarding obvious outliers and giving more weight to more recent entries.
- Also give lowNgn and highNgn for the plausible current range in that state.
- Normalise product names into clean canonical labels (e.g. "broiler" / "Broilers live" -> "Broiler (live)").
- Assign a category for each: one of poultry, cattle, goat, sheep, pig, fish, feed, eggs, other.
- confidence is 0–100: high when many recent, tightly-agreeing entries exist; lower when few entries, wide spread, or stale; lower still when you estimate a thin state by reasonable assumption.
- sampleSize is the number of raw entries that informed the figure.
- unit is "per kg".
- Where a state has very little data, you MAY infer a reasonable estimate from comparable states, but mark it with low confidence.

Return ONLY a single JSON object, no commentary, no markdown fences:
{ "prices": [ { "product": "...", "category": "...", "state": "...", "unit": "per kg", "priceNgn": 0, "lowNgn": 0, "highNgn": 0, "confidence": 0, "sampleSize": 0 } ] }

If there is no usable data, return { "prices": [] }.`;
}

export interface AggregateResult {
	prices: AggregatedPrice[];
	degraded: boolean;
}

export async function fetchAggregatedPrices(): Promise<AggregateResult> {
	const rows = await getPriceRows();
	if (rows.length === 0) {
		return { prices: [], degraded: true };
	}

	const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
	const response = await ai.models.generateContent({
		model: MODEL,
		contents: [{ role: 'user', parts: [{ text: buildPrompt(rows) }] }],
		config: { temperature: 0, maxOutputTokens: 8192 }
	});

	const text = (response.text ?? '').trim();
	const jsonText = extractJsonBlock(text);
	if (!jsonText) throw new Error('Aggregator returned no parseable JSON');

	let parsed: { prices?: unknown[] };
	try {
		parsed = JSON.parse(jsonText) as { prices?: unknown[] };
	} catch {
		throw new Error('Aggregator returned malformed JSON');
	}

	const prices = (parsed.prices ?? [])
		.map((raw) => normaliseAggregate(raw))
		.filter((p): p is AggregatedPrice => p !== null);

	// Sort by state then product so the board groups cleanly.
	prices.sort((a, b) => a.state.localeCompare(b.state) || a.product.localeCompare(b.product));

	// Flag a thin dataset (few raw entries) so the UI can caveat it.
	const degraded = rows.length < 5 || prices.length === 0;

	return { prices, degraded };
}
