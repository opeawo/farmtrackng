// Daily historical price index. Same modeled figure as the current snapshot,
// but grouped by product × state × DAY instead of collapsing all history into
// one point. Powers GET /api/v1/prices/history.
//
// Source is the same field-agent Google Sheet: getPriceRows() already carries
// each entry's WAT timestamp ("YYYY-MM-DD HH:mm:ss"); parseDate() reduces it to
// the YYYY-MM-DD bucket. Days with few entries simply carry a low sampleSize /
// confidence — no fabrication.

import { getPriceRows } from './sheets';
import { summarizePrices } from './aggregate';
import { categoryFor, unitForCategory } from '$lib/markets/units';
import { parseDate } from '$lib/server/loans/normalise';
import type { AggregatedPrice } from './types';
import * as cache from './cache';
import { EDGE_CACHE_OK, EDGE_CACHE_RETRY } from './index-cache';

export interface DailyPrice extends AggregatedPrice {
	date: string; // YYYY-MM-DD (West Africa Time)
}

export interface HistoryResult {
	prices: DailyPrice[];
	degraded: boolean;
}

const CACHE_KEY = 'markets:history';
const TTL_MS = 24 * 60 * 60 * 1000;

/** Compute the full daily-bucketed index from raw agent entries. */
export async function fetchPriceHistory(): Promise<HistoryResult> {
	const rows = await getPriceRows();
	if (rows.length === 0) return { prices: [], degraded: true };

	// Group by product (case-normalised) + state + day, keeping display labels.
	interface Group {
		product: string;
		state: string;
		date: string;
		prices: number[];
	}
	const groups = new Map<string, Group>();
	for (const r of rows) {
		const product = r.product.trim();
		const state = r.state.trim();
		const date = parseDate(r.timestampWat);
		if (!product || !state || !date || !(r.priceNgn >= 100)) continue;
		const key = `${product.toLowerCase()}|${state.toLowerCase()}|${date}`;
		let g = groups.get(key);
		if (!g) {
			g = { product, state, date, prices: [] };
			groups.set(key, g);
		}
		g.prices.push(r.priceNgn);
	}

	const prices: DailyPrice[] = [];
	for (const g of groups.values()) {
		const category = categoryFor(g.product);
		prices.push({
			date: g.date,
			product: g.product,
			category,
			state: g.state,
			unit: unitForCategory(category),
			...summarizePrices(g.prices)
		});
	}

	// Newest first, then state, then product — a natural time-series order.
	prices.sort(
		(a, b) =>
			b.date.localeCompare(a.date) ||
			a.state.localeCompare(b.state) ||
			a.product.localeCompare(b.product)
	);

	return { prices, degraded: rows.length < 5 };
}

export interface HistoryPayload extends HistoryResult {
	fetchedAt: string;
	stale: boolean;
	error?: string;
}

export interface HistoryAccessResult {
	history: HistoryPayload;
	cacheControl: string;
	status: number;
}

interface CachedHistory {
	fetchedAt: string;
	prices: DailyPrice[];
	degraded: boolean;
}

/**
 * Cached daily history with stale-while-revalidate, mirroring getPriceIndex().
 * The full dataset is computed once per 24h; endpoints filter it in memory.
 */
export async function getPriceHistory(): Promise<HistoryAccessResult> {
	const existing = cache.get<CachedHistory>(CACHE_KEY);
	if (existing && !cache.isExpired(existing)) {
		return { history: { ...existing.data, stale: false }, cacheControl: EDGE_CACHE_OK, status: 200 };
	}

	try {
		const { prices, degraded } = await fetchPriceHistory();
		if (prices.length > 0) {
			const data: CachedHistory = { fetchedAt: new Date().toISOString(), prices, degraded };
			cache.set(CACHE_KEY, data, TTL_MS);
			return { history: { ...data, stale: false }, cacheControl: EDGE_CACHE_OK, status: 200 };
		}
		if (existing) {
			return {
				history: { ...existing.data, stale: true, error: 'Latest update produced no history; showing the previous data.' },
				cacheControl: EDGE_CACHE_RETRY,
				status: 200
			};
		}
		return {
			history: { fetchedAt: new Date().toISOString(), prices: [], degraded: true, stale: true, error: 'No price history available yet.' },
			cacheControl: EDGE_CACHE_RETRY,
			status: 200
		};
	} catch (err) {
		console.error('[markets/history] aggregation failed', err);
		if (existing) {
			return {
				history: { ...existing.data, stale: true, error: 'Could not refresh history; showing the most recent data.' },
				cacheControl: EDGE_CACHE_RETRY,
				status: 200
			};
		}
		return {
			history: { fetchedAt: new Date().toISOString(), prices: [], degraded: true, stale: true, error: 'Price history is temporarily unavailable.' },
			cacheControl: 'no-store',
			status: 502
		};
	}
}
