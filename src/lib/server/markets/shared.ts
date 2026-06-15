// Helpers shared by the market aggregation pipeline.

import type { AggregatedPrice, ListingCategory } from './types';

const ALLOWED_CATEGORIES: ListingCategory[] = [
	'poultry',
	'cattle',
	'goat',
	'sheep',
	'pig',
	'fish',
	'feed',
	'eggs',
	'other'
];

// Grounded / generative responses sometimes wrap JSON in markdown fences,
// prepend commentary, or append footnotes. Extract the first balanced
// { ... } block.
export function extractJsonBlock(text: string): string | null {
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

interface RawAggregate {
	product?: unknown;
	category?: unknown;
	state?: unknown;
	unit?: unknown;
	priceNgn?: unknown;
	lowNgn?: unknown;
	highNgn?: unknown;
	confidence?: unknown;
	sampleSize?: unknown;
}

function finiteNumber(v: unknown): number | null {
	if (typeof v === 'number' && Number.isFinite(v)) return v;
	if (typeof v === 'string') {
		const n = Number(v.replace(/[₦,\s]/g, ''));
		if (Number.isFinite(n)) return n;
	}
	return null;
}

// Validate a single aggregated price emitted by the model. Returns null when
// the entry is unusable (no product/state, price below the placeholder floor).
export function normaliseAggregate(raw: unknown): AggregatedPrice | null {
	if (!raw || typeof raw !== 'object') return null;
	const r = raw as RawAggregate;

	const product = typeof r.product === 'string' ? r.product.trim().slice(0, 120) : '';
	const state = typeof r.state === 'string' ? r.state.trim().slice(0, 60) : '';
	if (!product || !state) return null;

	const price = finiteNumber(r.priceNgn);
	if (price === null || price < 100) return null;

	const category =
		typeof r.category === 'string' && ALLOWED_CATEGORIES.includes(r.category as ListingCategory)
			? (r.category as ListingCategory)
			: 'other';

	const unit =
		typeof r.unit === 'string' && r.unit.trim() ? r.unit.trim().slice(0, 30) : 'per kg';

	const low = finiteNumber(r.lowNgn);
	const high = finiteNumber(r.highNgn);

	const confidenceRaw = finiteNumber(r.confidence) ?? 0;
	const confidence = Math.max(0, Math.min(100, Math.round(confidenceRaw)));

	const sampleRaw = finiteNumber(r.sampleSize) ?? 0;
	const sampleSize = Math.max(0, Math.round(sampleRaw));

	return {
		product,
		category,
		state,
		unit,
		priceNgn: Math.round(price),
		lowNgn: low !== null && low >= 100 ? Math.round(low) : undefined,
		highNgn: high !== null && high >= 100 ? Math.round(high) : undefined,
		confidence,
		sampleSize
	};
}
