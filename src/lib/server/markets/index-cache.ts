// Shared accessor for FarmPaddy's modeled price index (current snapshot).
//
// Wraps fetchAggregatedPrices() in a 24h in-memory cache with
// stale-while-revalidate semantics, and decides the Vercel edge Cache-Control
// header for each outcome. Used by both the site's internal
// GET /api/markets/prices and the authenticated GET /api/v1/prices so they
// share one warmed cache and behave identically.
//
//   - 24h TTL; first request after expiry triggers a refresh.
//   - On refresh failure, serve the most recent successful cache (stale).
//   - If nothing is cached and the refresh fails, return an error payload.

import * as cache from './cache';
import { fetchAggregatedPrices } from './aggregate';
import type { AggregatedPrice } from './types';

const CACHE_KEY = 'markets:index';
const TTL_MS = 24 * 60 * 60 * 1000;

// Vercel's edge cache is shared across function instances (unlike the in-memory
// cache above), so a good response is served CDN-fast to everyone for 15 min
// and revalidated in the background for up to a day.
export const EDGE_CACHE_OK = 'public, s-maxage=900, stale-while-revalidate=86400';
// Degraded/stale responses: cache briefly so the edge retries soon.
export const EDGE_CACHE_RETRY = 'public, s-maxage=60';

interface CachedPayload {
	fetchedAt: string;
	prices: AggregatedPrice[];
	degraded: boolean;
}

export interface PriceIndex extends CachedPayload {
	stale: boolean;
	error?: string;
}

export interface IndexResult {
	index: PriceIndex;
	cacheControl: string;
	status: number;
}

export async function getPriceIndex(): Promise<IndexResult> {
	const existing = cache.get<CachedPayload>(CACHE_KEY);

	if (existing && !cache.isExpired(existing)) {
		return { index: { ...existing.data, stale: false }, cacheControl: EDGE_CACHE_OK, status: 200 };
	}

	try {
		const { prices, degraded } = await fetchAggregatedPrices();
		if (prices.length > 0) {
			const data: CachedPayload = { fetchedAt: new Date().toISOString(), prices, degraded };
			cache.set(CACHE_KEY, data, TTL_MS);
			return { index: { ...data, stale: false }, cacheControl: EDGE_CACHE_OK, status: 200 };
		}

		// Refresh succeeded but produced nothing usable.
		if (existing) {
			return {
				index: {
					...existing.data,
					stale: true,
					error: 'Latest update produced no prices; showing the previous index.'
				},
				cacheControl: EDGE_CACHE_RETRY,
				status: 200
			};
		}
		return {
			index: {
				fetchedAt: new Date().toISOString(),
				prices: [],
				degraded: true,
				stale: true,
				error: 'No prices available yet. Please check back soon.'
			},
			cacheControl: EDGE_CACHE_RETRY,
			status: 200
		};
	} catch (err) {
		console.error('[markets/index-cache] aggregation failed', err);
		if (existing) {
			return {
				index: {
					...existing.data,
					stale: true,
					error: 'Could not refresh prices; showing the most recent index.'
				},
				cacheControl: EDGE_CACHE_RETRY,
				status: 200
			};
		}
		return {
			index: {
				fetchedAt: new Date().toISOString(),
				prices: [],
				degraded: true,
				stale: true,
				error: 'Prices are temporarily unavailable.'
			},
			cacheControl: 'no-store',
			status: 502
		};
	}
}
