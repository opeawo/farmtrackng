// GET /api/v1/prices — current modeled price index (authenticated).
//
// Auth, CORS and rate limiting are handled upstream in hooks.server.ts; this
// handler only shapes the response. Filters: state, product, category.

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPriceIndex } from '$lib/server/markets/index-cache';
import { filterPrices, isFilterError } from '$lib/server/api/filters';

export const GET: RequestHandler = async ({ url, setHeaders }) => {
	const { index, cacheControl, status } = await getPriceIndex();

	const filtered = filterPrices(index.prices, url);
	if (isFilterError(filtered)) {
		return json({ error: 'invalid_query', message: filtered.error }, { status: 400 });
	}

	setHeaders({ 'cache-control': cacheControl });
	return json(
		{
			fetchedAt: index.fetchedAt,
			count: filtered.length,
			degraded: index.degraded,
			stale: index.stale,
			...(index.error ? { notice: index.error } : {}),
			prices: filtered
		},
		{ status }
	);
};
