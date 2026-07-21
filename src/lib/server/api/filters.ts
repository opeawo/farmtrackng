// Query-param filtering shared by the /api/v1 pricing endpoints.

import { LISTING_CATEGORIES } from '$lib/server/markets/types';
import type { AggregatedPrice, ListingCategory } from '$lib/server/markets/types';

export interface FilterError {
	error: string;
}

export function isFilterError(v: unknown): v is FilterError {
	return typeof v === 'object' && v !== null && 'error' in v;
}

/**
 * Filter a price list by the common query params:
 *   state    — exact, case-insensitive
 *   product  — case-insensitive substring
 *   category — one of LISTING_CATEGORIES (400 on unknown)
 * Works for both AggregatedPrice and DailyPrice (which extends it).
 */
export function filterPrices<T extends AggregatedPrice>(
	prices: T[],
	url: URL
): T[] | FilterError {
	const category = url.searchParams.get('category')?.trim().toLowerCase();
	if (category && !LISTING_CATEGORIES.includes(category as ListingCategory)) {
		return { error: `Unknown category "${category}". Valid categories: ${LISTING_CATEGORIES.join(', ')}.` };
	}
	const state = url.searchParams.get('state')?.trim().toLowerCase();
	const product = url.searchParams.get('product')?.trim().toLowerCase();

	return prices.filter(
		(p) =>
			(!state || p.state.toLowerCase() === state) &&
			(!product || p.product.toLowerCase().includes(product)) &&
			(!category || p.category === category)
	);
}
