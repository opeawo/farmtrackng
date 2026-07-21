// GET /api/markets/prices
// Returns FarmPaddy's modeled livestock price index — a per-state, per-livestock
// aggregate built from field-agent entries. Cached in memory with
// stale-while-revalidate semantics (see $lib/server/markets/index-cache).

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPriceIndex } from '$lib/server/markets/index-cache';

export const GET: RequestHandler = async ({ setHeaders }) => {
	const { index, cacheControl, status } = await getPriceIndex();
	setHeaders({ 'cache-control': cacheControl });
	return json(index, { status });
};
