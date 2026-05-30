// Shared shape used by every market price source. New sources add to the
// SourceId union; the rest of the system treats listings uniformly.

export type SourceId = 'jiji' | 'poultry-plaza';

export const SOURCE_META: Record<SourceId, { label: string; baseUrl: string }> = {
	jiji: { label: 'Jiji', baseUrl: 'https://jiji.ng/livestock-and-poultry' },
	'poultry-plaza': { label: 'Poultry Plaza', baseUrl: 'https://www.facebook.com/poultryplaza' }
};

export type ListingCategory =
	| 'poultry'
	| 'cattle'
	| 'goat'
	| 'sheep'
	| 'pig'
	| 'fish'
	| 'feed'
	| 'eggs'
	| 'other';

export interface MarketListing {
	source: SourceId;
	title: string;
	priceNgn: number;
	unit?: string; // 'each', 'per kg', 'per crate', 'per bag', etc.
	location: string;
	postedAt: string;
	url: string;
	category: ListingCategory;
}

export const LISTING_CATEGORIES: ListingCategory[] = [
	'poultry',
	'cattle',
	'goat',
	'sheep',
	'pig',
	'fish',
	'feed',
	'eggs',
	'other'
];
