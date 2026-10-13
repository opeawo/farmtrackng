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
import { categoryFor, unitForProduct, needsCutoff, UNIT_CUTOFF_WAT } from '$lib/markets/units';
import { parseDate } from '$lib/server/loans/normalise';
import type { AggregatedPrice, ListingCategory } from './types';
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
		// Same unit-enforcement cutoff as the snapshot index: pre-cutoff rows are
		// unit-ambiguous for commodities whose bound unit isn't the old per-kg.
		if (needsCutoff(product) && r.timestampWat < UNIT_CUTOFF_WAT) continue;
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
			unit: unitForProduct(g.product),
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

// ── Market-level history (public /markets/history) ─────────────────────────
//
// The public Historical Data page needs the market dimension and arbitrary
// filter combinations, so it works from the cleaned raw entries rather than
// the pre-bucketed state × day index above. One Sheets read is cached briefly
// (10 min) so new agent submissions flow into the history automatically —
// there is no export or manual step.

/** First day of the public historical dataset. */
export const HISTORY_START = '2026-07-01';

export interface HistoryRow {
	date: string; // YYYY-MM-DD (WAT)
	state: string;
	market: string;
	product: string;
	category: ListingCategory;
	unit: string;
	priceNgn: number;
}

export interface HistoryRowsResult {
	rows: HistoryRow[];
	fetchedAt: string;
	stale: boolean;
	error?: string;
}

const ROWS_CACHE_KEY = 'markets:history:rows';
const ROWS_TTL_MS = 10 * 60 * 1000;

interface CachedRows {
	fetchedAt: string;
	rows: HistoryRow[];
}

async function fetchCleanRows(): Promise<HistoryRow[]> {
	const raw = await getPriceRows();
	const out: HistoryRow[] = [];
	for (const r of raw) {
		const product = r.product.trim();
		const state = r.state.trim();
		const date = parseDate(r.timestampWat);
		if (!product || !state || !date || !(r.priceNgn >= 100)) continue;
		if (date < HISTORY_START) continue;
		// Same unit-enforcement cutoff as the snapshot index and daily history.
		if (needsCutoff(product) && r.timestampWat < UNIT_CUTOFF_WAT) continue;
		out.push({
			date,
			state,
			market: r.market.trim() || 'Unspecified market',
			product,
			category: categoryFor(product),
			unit: unitForProduct(product),
			priceNgn: r.priceNgn
		});
	}
	return out;
}

/** Cleaned agent entries since HISTORY_START, cached 10 min with stale fallback. */
export async function getCleanHistoryRows(): Promise<HistoryRowsResult> {
	const existing = cache.get<CachedRows>(ROWS_CACHE_KEY);
	if (existing && !cache.isExpired(existing)) return { ...existing.data, stale: false };
	try {
		const rows = await fetchCleanRows();
		const data: CachedRows = { fetchedAt: new Date().toISOString(), rows };
		cache.set(ROWS_CACHE_KEY, data, ROWS_TTL_MS);
		return { ...data, stale: false };
	} catch (err) {
		console.error('[markets/history] row fetch failed', err);
		if (existing) {
			return { ...existing.data, stale: true, error: 'Could not refresh history; showing the most recent data.' };
		}
		return {
			fetchedAt: new Date().toISOString(),
			rows: [],
			stale: true,
			error: 'Price history is temporarily unavailable.'
		};
	}
}

/**
 * Drop this instance's cached history so the next read picks up a fresh
 * submission immediately. Best-effort only (other instances keep their cache
 * until the 10-min TTL) — the TTL is what guarantees freshness.
 */
export function invalidateHistory(): void {
	cache.del(ROWS_CACHE_KEY);
	cache.del(CACHE_KEY);
}
