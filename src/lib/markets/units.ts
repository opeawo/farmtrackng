// Client-safe market category + unit helpers. Shared by the server-side
// aggregator, the markets UI, the intake form, and the AI prompt — must not
// import anything from $lib/server.
//
// Every commodity has ONE mandatory reporting unit, bound in COMMODITY_UNITS
// below. The unit is a property of the commodity — agents never choose or
// enter a unit; the intake form displays the bound unit and the server stamps
// it onto every submitted row.

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

export const PRICE_UNITS = [
	'per bird',
	'per 100 chicks',
	'per kg',
	'per head',
	'per crate of 30',
	'per 25kg bag',
	'per 50kg bag',
	'per 100kg bag',
	'per 100-dose vial',
	'per dose',
	'per sachet',
	'per bottle'
] as const;

export type PriceUnit = (typeof PRICE_UNITS)[number];

// Livestock traded per animal in Nigerian markets; everything else is per kg.
export const PER_HEAD_CATEGORIES: ReadonlySet<ListingCategory> = new Set(['cattle', 'goat']);
// Vaccines are sold and quoted per dose (vial-dose), not by weight.
export const PER_DOSE_CATEGORIES: ReadonlySet<ListingCategory> = new Set(['vaccine']);

// Category-level fallback for commodities that have no explicit binding in
// COMMODITY_UNITS (e.g. a type newly added to the Sheet's Livestock tab).
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

// Name normalisation so typographic variants bind to the same commodity:
// "Broiler — Large" ≡ "Broiler - Large", "Maize / Corn" ≡ "Maize/Corn".
export function normalizeCommodity(name: string): string {
	return name
		.toLowerCase()
		.replace(/[—–]/g, '-') // em/en dashes → hyphen
		.replace(/\s*([-/])\s*/g, '$1') // no spaces around - or /
		.replace(/\s+/g, ' ')
		.trim();
}

// The mandatory reporting unit for each commodity (normalised name → unit).
// Source: FarmPaddy unit-standardisation mapping, July 2026. Aliases for
// platform spellings are marked. NOT agent-editable — this is the schema.
const COMMODITY_UNIT_ENTRIES: [string, PriceUnit][] = [
	// Poultry — live birds
	['Broiler — Small', 'per bird'],
	['Broiler — Medium', 'per bird'],
	['Broiler — Large', 'per bird'],
	['Layer hen — Point of lay', 'per bird'],
	['Spent Layer', 'per bird'],
	['Cockerel', 'per bird'],
	['Turkey', 'per bird'],
	['Duck', 'per bird'],
	['Guinea fowl', 'per bird'],
	// Day-old chicks
	['Day-old chicks — Broiler', 'per 100 chicks'],
	['Day-old chicks — Layer', 'per 100 chicks'],
	// Processed poultry
	['Dressed Chicken — Fresh', 'per kg'],
	['Dressed Chicken — Frozen', 'per kg'],
	['Chicken Thigh', 'per kg'],
	['Chicken Breast', 'per kg'],
	['Chicken Drumstick', 'per kg'],
	['Chicken Wings', 'per kg'],
	['Chicken Offal', 'per kg'],
	// Ruminants & livestock
	['Cattle — Bull/Cow', 'per head'],
	['Cattle', 'per head'], // platform name for "Cattle — Bull/Cow"
	['Goat', 'per head'],
	['Sheep / Ram', 'per head'],
	['Sheep', 'per head'], // platform lists Sheep and Ram separately
	['Ram', 'per head'],
	['Pig', 'per head'],
	// Eggs
	['Eggs — Large', 'per crate of 30'],
	['Eggs — Medium', 'per crate of 30'],
	['Eggs — Small', 'per crate of 30'],
	// Feed
	['Broiler Starter Feed', 'per 25kg bag'],
	['Broiler Grower Feed', 'per 25kg bag'],
	['Broiler Finisher Feed', 'per 25kg bag'],
	['Layer Chick Mash', 'per 25kg bag'],
	['Layer Grower Mash', 'per 25kg bag'],
	['Layer Production Mash', 'per 25kg bag'],
	// Feed ingredients
	['Maize / Corn', 'per 100kg bag'],
	['Soybean Meal', 'per 50kg bag'],
	['Wheat Offal', 'per 50kg bag'],
	['Fish Meal', 'per 25kg bag'],
	// Animal health / vet
	['Newcastle Vaccine', 'per 100-dose vial'],
	['Gumboro Vaccine', 'per 100-dose vial'],
	['PPR Vaccine', 'per dose'],
	['Oxytetracycline', 'per sachet'],
	['Amprolium', 'per sachet'],
	['Ampolium', 'per sachet'], // legacy misspelling of Amprolium in the Sheet
	['Multivitamins', 'per sachet'],
	['Ivermectin', 'per bottle'],
	// Platform commodities beyond the July 2026 mapping (agreed additions)
	['Camels', 'per head'],
	['Chicken', 'per bird'],
	['Poultry', 'per bird'],
	['Fodder', 'per kg']
];

export const COMMODITY_UNITS: ReadonlyMap<string, PriceUnit> = new Map(
	COMMODITY_UNIT_ENTRIES.map(([name, unit]) => [normalizeCommodity(name), unit])
);

/** The mandatory reporting unit for a commodity; category fallback if unbound. */
export function unitForProduct(product: string): PriceUnit {
	return COMMODITY_UNITS.get(normalizeCommodity(product)) ?? unitForCategory(categoryFor(product));
}

/** Compact suffix form of a unit for tight UI ("₦8,000/bird"). */
export function unitShort(unit: string): string {
	const map: Record<string, string> = {
		'per bird': '/bird',
		'per 100 chicks': '/100 chicks',
		'per kg': '/kg',
		'per head': '/head',
		'per crate of 30': '/crate (30)',
		'per 25kg bag': '/25kg bag',
		'per 50kg bag': '/50kg bag',
		'per 100kg bag': '/100kg bag',
		'per 100-dose vial': '/100-dose vial',
		'per dose': '/dose',
		'per sachet': '/sachet',
		'per bottle': '/bottle'
	};
	return map[unit] ?? `/${unit.replace(/^per\s+/, '')}`;
}

// Rows submitted before unit enforcement went live are unit-ambiguous for any
// commodity whose bound unit is not the old "per kg" label — except cattle and
// goats, whose history was already whole-animal prices (relabeled June 2026).
// The aggregator excludes those pre-cutoff rows.
// First full WAT day after unit enforcement went live (deployed 2026-08-05).
export const UNIT_CUTOFF_WAT = '2026-08-06 00:00:00';

export function needsCutoff(product: string): boolean {
	const category = categoryFor(product);
	if (category === 'cattle' || category === 'goat') return false;
	return unitForProduct(product) !== 'per kg';
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
