// GET /api/v1/meta — enumerations to help consumers build queries
// (authenticated). Lists the states and products currently in the index, the
// category vocabulary, the category-fallback units, and each product's
// mandatory reporting unit.

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPriceIndex } from '$lib/server/markets/index-cache';
import { LISTING_CATEGORIES } from '$lib/server/markets/types';
import { unitForCategory, unitForProduct } from '$lib/markets/units';

export const GET: RequestHandler = async ({ setHeaders }) => {
	const { index, cacheControl, status } = await getPriceIndex();

	const states = [...new Set(index.prices.map((p) => p.state))].sort((a, b) => a.localeCompare(b));
	const products = [...new Set(index.prices.map((p) => p.product))].sort((a, b) => a.localeCompare(b));
	// Kept for backward compatibility: category-level fallback units.
	const units = Object.fromEntries(LISTING_CATEGORIES.map((c) => [c, unitForCategory(c)]));
	// The authoritative per-commodity reporting units (fixed, not agent-editable).
	const productUnits = Object.fromEntries(products.map((p) => [p, unitForProduct(p)]));

	setHeaders({ 'cache-control': cacheControl });
	return json(
		{
			fetchedAt: index.fetchedAt,
			states,
			products,
			categories: LISTING_CATEGORIES,
			units,
			productUnits
		},
		{ status }
	);
};
