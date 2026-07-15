// Aggregate raw field-agent price entries into FarmPaddy's modeled price index.
//
// The agent intake (Google Sheet) is the only source. We group the raw entries
// by livestock type + state and compute a robust representative price — per
// head for cattle and goats, per kg for everything else —
// (outlier-trimmed median), a plausible low–high range, and a confidence score
// from sample size and price spread. Done deterministically in code so it is
// instant and scales to thousands of rows. The output carries no source
// identity — it is presented as FarmPaddy's own index.

import { getPriceRows, type PriceRow } from './sheets';
import { categoryFor, unitForCategory } from '$lib/markets/units';
import type { AggregatedPrice } from './types';

export interface AggregateResult {
	prices: AggregatedPrice[];
	degraded: boolean;
}

function median(sorted: number[]): number {
	const n = sorted.length;
	if (n === 0) return 0;
	const mid = Math.floor(n / 2);
	return n % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function quantile(sorted: number[], q: number): number {
	if (sorted.length === 0) return 0;
	const pos = (sorted.length - 1) * q;
	const base = Math.floor(pos);
	const rest = pos - base;
	return sorted[base + 1] !== undefined
		? sorted[base] + rest * (sorted[base + 1] - sorted[base])
		: sorted[base];
}

// Drop IQR outliers when there are enough points to make that meaningful.
function trimOutliers(sorted: number[]): number[] {
	if (sorted.length < 4) return sorted;
	const q1 = quantile(sorted, 0.25);
	const q3 = quantile(sorted, 0.75);
	const iqr = q3 - q1;
	const lo = q1 - 1.5 * iqr;
	const hi = q3 + 1.5 * iqr;
	const kept = sorted.filter((v) => v >= lo && v <= hi);
	return kept.length ? kept : sorted;
}

// Confidence 0–100 from sample size and relative spread (coefficient of variation).
function confidenceFor(values: number[], mean: number): number {
	const n = values.length;
	let base: number;
	if (n >= 8) base = 90;
	else if (n >= 5) base = 84;
	else if (n >= 3) base = 74;
	else if (n === 2) base = 62;
	else base = 45;

	if (n >= 2 && mean > 0) {
		const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
		const cv = Math.sqrt(variance) / mean; // 0 = identical, higher = noisier
		base -= Math.min(20, Math.round(cv * 60));
	}
	return Math.max(30, Math.min(95, Math.round(base)));
}

export async function fetchAggregatedPrices(): Promise<AggregateResult> {
	const rows = await getPriceRows();
	if (rows.length === 0) {
		return { prices: [], degraded: true };
	}

	// Group by product (case-normalised) + state, keeping a display label.
	interface Group {
		product: string;
		state: string;
		prices: number[];
	}
	const groups = new Map<string, Group>();
	for (const r of rows) {
		const product = r.product.trim();
		const state = r.state.trim();
		if (!product || !state || !(r.priceNgn >= 100)) continue;
		const key = `${product.toLowerCase()}|${state.toLowerCase()}`;
		let g = groups.get(key);
		if (!g) {
			g = { product, state, prices: [] };
			groups.set(key, g);
		}
		g.prices.push(r.priceNgn);
	}

	const prices: AggregatedPrice[] = [];
	for (const g of groups.values()) {
		const sorted = [...g.prices].sort((a, b) => a - b);
		const kept = trimOutliers(sorted);
		const mean = kept.reduce((s, v) => s + v, 0) / kept.length;
		const category = categoryFor(g.product);
		prices.push({
			product: g.product,
			category,
			state: g.state,
			unit: unitForCategory(category),
			priceNgn: Math.round(median(kept)),
			lowNgn: Math.round(kept[0]),
			highNgn: Math.round(kept[kept.length - 1]),
			confidence: confidenceFor(kept, mean),
			sampleSize: g.prices.length
		});
	}

	// Sort by state then product so the board groups cleanly.
	prices.sort((a, b) => a.state.localeCompare(b.state) || a.product.localeCompare(b.product));

	// Flag a thin dataset (very few raw entries) so the UI can caveat it.
	const degraded = rows.length < 5;

	return { prices, degraded };
}
