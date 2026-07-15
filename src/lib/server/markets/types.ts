// Shared shapes for the market price index. Prices are sourced entirely from
// the FarmPaddy field-agent intake (a Google Sheet) and aggregated into a
// per-state, per-livestock index before they ever reach the client.

import type { ListingCategory } from '$lib/markets/units';

export type { ListingCategory };

export const LISTING_CATEGORIES: ListingCategory[] = [
	'poultry',
	'cattle',
	'goat',
	'sheep',
	'pig',
	'fish',
	'feed',
	'eggs',
	'vaccine',
	'other'
];

// A single modeled price point — the only shape that leaves the server. No
// source identity: the figure is FarmPaddy's aggregated estimate.
export interface AggregatedPrice {
	product: string; // canonical livestock/product name, e.g. "Broiler (live)"
	category: ListingCategory;
	state: string; // Nigerian state
	unit: string; // "per head" (cattle, goats) or "per kg" (everything else)
	priceNgn: number; // modeled representative price
	lowNgn?: number;
	highNgn?: number;
	confidence: number; // 0–100 accuracy %
	sampleSize: number; // agent entries informing this point
}
