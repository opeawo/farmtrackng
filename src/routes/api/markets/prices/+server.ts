// GET /api/markets/prices
// Returns the most recent Jiji livestock-and-poultry listings, cached in
// memory with stale-while-revalidate semantics.
//
//   - 24h TTL.
//   - First request after expiry triggers a refresh.
//   - If the refresh fails, the previous cache is served with stale: true.
//   - Cold starts re-fetch (no persistence across Vercel instances).

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as cache from '$lib/server/markets/cache';
import { fetchJijiListings, type FetchResult } from '$lib/server/markets/jiji';

const CACHE_KEY = 'markets:jiji';
const TTL_MS = 24 * 60 * 60 * 1000;

interface PricesResponse {
	fetchedAt: string;
	source: string;
	listings: FetchResult['listings'];
	stale: boolean;
	error?: string;
}

export const GET: RequestHandler = async () => {
	const existing = cache.get<FetchResult>(CACHE_KEY);
	const expired = cache.isExpired(existing);

	if (!expired && existing) {
		const payload: PricesResponse = {
			fetchedAt: existing.data.fetchedAt,
			source: existing.data.source,
			listings: existing.data.listings,
			stale: false
		};
		return json(payload);
	}

	try {
		const fresh = await fetchJijiListings();
		// Only cache if we actually got listings — empty arrays usually mean a
		// markup-drift or block, in which case we'd rather keep the previous
		// cache and try again next hit.
		if (fresh.listings.length > 0) {
			cache.set(CACHE_KEY, fresh, TTL_MS);
			const payload: PricesResponse = {
				fetchedAt: fresh.fetchedAt,
				source: fresh.source,
				listings: fresh.listings,
				stale: false
			};
			return json(payload);
		}
		// Empty refresh — fall through to serve whatever stale data exists.
		console.warn('[api/markets/prices] Jiji fetch returned 0 listings');
		if (existing) {
			return json({
				fetchedAt: existing.data.fetchedAt,
				source: existing.data.source,
				listings: existing.data.listings,
				stale: true,
				error: 'Latest fetch returned no listings; showing previous data.'
			} satisfies PricesResponse);
		}
		return json({
			fetchedAt: new Date().toISOString(),
			source: fresh.source,
			listings: [],
			stale: true,
			error: 'No listings available right now. Please try again later.'
		} satisfies PricesResponse);
	} catch (err) {
		console.error('[api/markets/prices] refresh failed', err);
		if (existing) {
			return json({
				fetchedAt: existing.data.fetchedAt,
				source: existing.data.source,
				listings: existing.data.listings,
				stale: true,
				error: 'Could not refresh prices; showing the most recent successful fetch.'
			} satisfies PricesResponse);
		}
		return json(
			{
				fetchedAt: new Date().toISOString(),
				source: 'https://jiji.ng/livestock-and-poultry',
				listings: [],
				stale: true,
				error: 'Live prices are temporarily unavailable.'
			} satisfies PricesResponse,
			{ status: 502 }
		);
	}
};
