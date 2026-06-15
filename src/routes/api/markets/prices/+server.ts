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

export const GET: RequestHandler = async () => {
	const existing = cache.get<CachedPayload>(CACHE_KEY);

	if (existing && !cache.isExpired(existing)) {
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
			return json({ ...data, stale: false } satisfies PricesResponse);
		}

		// Refresh succeeded but produced nothing usable.
		if (existing) {
			return json({
				...existing.data,
				stale: true,
				error: 'Latest update produced no prices; showing the previous index.'
			} satisfies PricesResponse);
		}
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
			return json({
				...existing.data,
				stale: true,
				error: 'Could not refresh prices; showing the most recent index.'
			} satisfies PricesResponse);
		}
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
