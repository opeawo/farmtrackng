// GET /api/markets/prices
// Returns merged Nigerian livestock + poultry market prices from Jiji and
// Poultry Plaza. Cached in memory with stale-while-revalidate semantics.
//
//   - 24h TTL.
//   - First request after expiry triggers a refresh of both sources in parallel.
//   - If a source fails but the other succeeds, we return what we got and tag
//     the failed source in `partialErrors`.
//   - If both fail and we have a cache, we serve stale.
//   - If both fail and no cache, we return an empty list with an error string.

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as cache from '$lib/server/markets/cache';
import { fetchJijiListings } from '$lib/server/markets/jiji';
import { fetchPoultryPlazaListings } from '$lib/server/markets/poultry-plaza';
import { SOURCE_META, type MarketListing, type SourceId } from '$lib/server/markets/types';

const CACHE_KEY = 'markets:merged';
const TTL_MS = 24 * 60 * 60 * 1000;

interface CachedPayload {
	fetchedAt: string;
	listings: MarketListing[];
	partialErrors: { source: SourceId; message: string }[];
}

interface PricesResponse extends CachedPayload {
	sources: { id: SourceId; label: string; url: string }[];
	stale: boolean;
	error?: string;
}

const SOURCES_META = (Object.entries(SOURCE_META) as [SourceId, (typeof SOURCE_META)[SourceId]][]).map(
	([id, meta]) => ({ id, label: meta.label, url: meta.baseUrl })
);

async function refreshAll(): Promise<CachedPayload> {
	const [jijiResult, ppResult] = await Promise.allSettled([
		fetchJijiListings(),
		fetchPoultryPlazaListings()
	]);

	const listings: MarketListing[] = [];
	const partialErrors: { source: SourceId; message: string }[] = [];

	if (jijiResult.status === 'fulfilled') {
		listings.push(...jijiResult.value);
	} else {
		console.error('[api/markets/prices] Jiji fetch failed', jijiResult.reason);
		partialErrors.push({
			source: 'jiji',
			message: jijiResult.reason instanceof Error ? jijiResult.reason.message : String(jijiResult.reason)
		});
	}

	if (ppResult.status === 'fulfilled') {
		listings.push(...ppResult.value);
	} else {
		console.error('[api/markets/prices] Poultry Plaza fetch failed', ppResult.reason);
		partialErrors.push({
			source: 'poultry-plaza',
			message: ppResult.reason instanceof Error ? ppResult.reason.message : String(ppResult.reason)
		});
	}

	// Newest-first within each source; Poultry Plaza posts often have explicit
	// dates while Jiji uses relative ("Today", "1 day ago"). Without reliable
	// timestamps we keep insertion order grouped by source — Jiji first, then
	// Poultry Plaza. The UI shows a source badge so origin is always visible.
	return {
		fetchedAt: new Date().toISOString(),
		listings,
		partialErrors
	};
}

export const GET: RequestHandler = async () => {
	const existing = cache.get<CachedPayload>(CACHE_KEY);
	const expired = cache.isExpired(existing);

	if (!expired && existing) {
		const payload: PricesResponse = {
			...existing.data,
			sources: SOURCES_META,
			stale: false
		};
		return json(payload);
	}

	const fresh = await refreshAll();
	const anyData = fresh.listings.length > 0;
	const allFailed = fresh.partialErrors.length === SOURCES_META.length;

	if (anyData) {
		cache.set(CACHE_KEY, fresh, TTL_MS);
		const payload: PricesResponse = {
			...fresh,
			sources: SOURCES_META,
			stale: false
		};
		return json(payload);
	}

	// No listings this refresh — either both sources failed, or both returned zero.
	if (existing) {
		const payload: PricesResponse = {
			...existing.data,
			sources: SOURCES_META,
			stale: true,
			error: allFailed
				? 'Could not refresh prices; showing the most recent successful fetch.'
				: 'Latest refresh returned no listings; showing previous data.'
		};
		return json(payload);
	}

	const payload: PricesResponse = {
		...fresh,
		sources: SOURCES_META,
		stale: true,
		error: allFailed
			? 'Live prices are temporarily unavailable.'
			: 'No listings available right now. Please try again later.'
	};
	return json(payload, { status: allFailed ? 502 : 200 });
};
