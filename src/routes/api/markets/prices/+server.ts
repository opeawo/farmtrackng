// GET /api/markets/prices
// Returns FarmPaddy's modeled livestock price index — a per-state, per-livestock
// aggregate built from field-agent entries. Cached in memory with
// stale-while-revalidate semantics.
//
//   - 24h TTL.
//   - First request after expiry triggers a refresh.
//   - On refresh failure, serve the most recent successful cache (stale).
//   - If there is nothing cached and the refresh fails, return an error string.

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as cache from '$lib/server/markets/cache';
import { fetchAggregatedPrices } from '$lib/server/markets/aggregate';
import type { AggregatedPrice } from '$lib/server/markets/types';

const CACHE_KEY = 'markets:index';
const TTL_MS = 24 * 60 * 60 * 1000;

interface CachedPayload {
	fetchedAt: string;
	prices: AggregatedPrice[];
	degraded: boolean;
}

interface PricesResponse extends CachedPayload {
	stale: boolean;
	error?: string;
}

// Vercel's edge cache is shared across function instances (unlike the
// in-memory cache below), so a good response is served CDN-fast to everyone
// for 15 min and revalidated in the background for up to a day.
const EDGE_CACHE_OK = 'public, s-maxage=900, stale-while-revalidate=86400';
// Degraded/stale responses: cache briefly so the edge retries soon.
const EDGE_CACHE_RETRY = 'public, s-maxage=60';

export const GET: RequestHandler = async ({ setHeaders }) => {
	const existing = cache.get<CachedPayload>(CACHE_KEY);

	if (existing && !cache.isExpired(existing)) {
		setHeaders({ 'cache-control': EDGE_CACHE_OK });
		const payload: PricesResponse = { ...existing.data, stale: false };
		return json(payload);
	}

	try {
		const { prices, degraded } = await fetchAggregatedPrices();
		if (prices.length > 0) {
			const data: CachedPayload = {
				fetchedAt: new Date().toISOString(),
				prices,
				degraded
			};
			cache.set(CACHE_KEY, data, TTL_MS);
			setHeaders({ 'cache-control': EDGE_CACHE_OK });
			return json({ ...data, stale: false } satisfies PricesResponse);
		}

		// Refresh succeeded but produced nothing usable.
		if (existing) {
			setHeaders({ 'cache-control': EDGE_CACHE_RETRY });
			return json({
				...existing.data,
				stale: true,
				error: 'Latest update produced no prices; showing the previous index.'
			} satisfies PricesResponse);
		}
		setHeaders({ 'cache-control': EDGE_CACHE_RETRY });
		return json({
			fetchedAt: new Date().toISOString(),
			prices: [],
			degraded: true,
			stale: true,
			error: 'No prices available yet. Please check back soon.'
		} satisfies PricesResponse);
	} catch (err) {
		console.error('[api/markets/prices] aggregation failed', err);
		if (existing) {
			setHeaders({ 'cache-control': EDGE_CACHE_RETRY });
			return json({
				...existing.data,
				stale: true,
				error: 'Could not refresh prices; showing the most recent index.'
			} satisfies PricesResponse);
		}
		setHeaders({ 'cache-control': 'no-store' });
		return json(
			{
				fetchedAt: new Date().toISOString(),
				prices: [],
				degraded: true,
				stale: true,
				error: 'Prices are temporarily unavailable.'
			} satisfies PricesResponse,
			{ status: 502 }
		);
	}
};
