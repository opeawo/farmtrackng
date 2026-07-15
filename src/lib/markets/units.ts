// Client-safe market category + unit helpers. Shared by the server-side
// aggregator, the markets UI, the intake form, and the AI prompt — must not
// import anything from $lib/server.

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

export type PriceUnit = 'per head' | 'per kg';

// Livestock traded per animal in Nigerian markets; everything else is per kg.
export const PER_HEAD_CATEGORIES: ReadonlySet<ListingCategory> = new Set(['cattle', 'goat']);

export function unitForCategory(category: string): PriceUnit {
	return PER_HEAD_CATEGORIES.has(category as ListingCategory) ? 'per head' : 'per kg';
}

export function unitSuffix(category: string): '/head' | '/kg' {
	return PER_HEAD_CATEGORIES.has(category as ListingCategory) ? '/head' : '/kg';
}

// Map a raw livestock/product name to a display category (for icons, filters
// and pricing units).
export function categoryFor(product: string): ListingCategory {
	const p = product.toLowerCase();
	if (/cattle|cow|beef|bull|zebu|bunaji/.test(p)) return 'cattle';
	if (/goat|chevon/.test(p)) return 'goat';
	if (/sheep|ram|mutton|lamb|ewe/.test(p)) return 'sheep';
	if (/pig|pork|hog|swine|boar/.test(p)) return 'pig';
	if (/poultry|chicken|broiler|layer|cockerel|fowl|turkey|duck|bird/.test(p)) return 'poultry';
	if (/fish|catfish|tilapia/.test(p)) return 'fish';
	if (/egg/.test(p)) return 'eggs';
	if (/feed|grain|fodder|maize|mash|meal/.test(p)) return 'feed';
	return 'other';
}
