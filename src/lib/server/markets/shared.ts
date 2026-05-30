// Helpers used by every market source fetcher.

import type { ListingCategory, MarketListing, SourceId } from './types';

const ALLOWED_CATEGORIES: ListingCategory[] = [
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

interface RawListing {
	title?: unknown;
	priceNgn?: unknown;
	unit?: unknown;
	location?: unknown;
	postedAt?: unknown;
	url?: unknown;
	category?: unknown;
}

interface NormaliseOpts {
	source: SourceId;
	urlHostPattern: RegExp; // listing URL must match this host
	urlPrefix: string; // prefix for relative URLs
}

// Grounded responses sometimes wrap JSON in markdown fences, prepend
// commentary, or append citation footnotes. Extract the first balanced
// { ... } block.
export function extractJsonBlock(text: string): string | null {
	const fenceMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
	if (fenceMatch) return fenceMatch[1];

	const start = text.indexOf('{');
	if (start === -1) return null;
	let depth = 0;
	for (let i = start; i < text.length; i++) {
		const ch = text[i];
		if (ch === '{') depth++;
		else if (ch === '}') {
			depth--;
			if (depth === 0) return text.slice(start, i + 1);
		}
	}
	return null;
}

export function normaliseListing(
	raw: unknown,
	opts: NormaliseOpts
): MarketListing | null {
	if (!raw || typeof raw !== 'object') return null;
	const r = raw as RawListing;

	if (typeof r.title !== 'string' || !r.title.trim()) return null;
	if (typeof r.priceNgn !== 'number' || !Number.isFinite(r.priceNgn) || r.priceNgn < 100) return null;
	if (typeof r.location !== 'string' || !r.location.trim()) return null;
	if (typeof r.url !== 'string' || !r.url.trim()) return null;

	let url = r.url.trim();
	if (url.startsWith('/')) url = `${opts.urlPrefix}${url}`;
	if (!url.startsWith('http')) url = `https://${url}`;
	if (!opts.urlHostPattern.test(url)) return null;

	const category =
		typeof r.category === 'string' && ALLOWED_CATEGORIES.includes(r.category as ListingCategory)
			? (r.category as ListingCategory)
			: 'other';

	const unit = typeof r.unit === 'string' && r.unit.trim() ? r.unit.trim().slice(0, 30) : undefined;

	return {
		source: opts.source,
		title: r.title.trim().slice(0, 200),
		priceNgn: Math.round(r.priceNgn),
		unit,
		location: r.location.trim().slice(0, 100),
		postedAt:
			(typeof r.postedAt === 'string' && r.postedAt.trim().slice(0, 60)) || 'Recently',
		url,
		category
	};
}
