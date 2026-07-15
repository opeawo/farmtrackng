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
	| 'vaccine'
	| 'other';

export type PriceUnit = 'per head' | 'per kg' | 'per dose';

// Livestock traded per animal in Nigerian markets; everything else is per kg.
export const PER_HEAD_CATEGORIES: ReadonlySet<ListingCategory> = new Set(['cattle', 'goat']);
// Vaccines are sold and quoted per dose (vial-dose), not by weight.
export const PER_DOSE_CATEGORIES: ReadonlySet<ListingCategory> = new Set(['vaccine']);

export function unitForCategory(category: string): PriceUnit {
	if (PER_HEAD_CATEGORIES.has(category as ListingCategory)) return 'per head';
	if (PER_DOSE_CATEGORIES.has(category as ListingCategory)) return 'per dose';
	return 'per kg';
}

export function unitSuffix(category: string): '/head' | '/kg' | '/dose' {
	if (PER_HEAD_CATEGORIES.has(category as ListingCategory)) return '/head';
	if (PER_DOSE_CATEGORIES.has(category as ListingCategory)) return '/dose';
	return '/kg';
}

// Map a raw livestock/product name to a display category (for icons, filters
// and pricing units).
export function categoryFor(product: string): ListingCategory {
	const p = product.toLowerCase();
	// Vaccines first: names like "Newcastle vaccine" or "Fowl pox vaccine" would
	// otherwise match a species keyword and be mis-filed under that animal.
	if (/vaccin|lasota|gumboro|komarov|newcastle|antigen|serum/.test(p)) return 'vaccine';
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
