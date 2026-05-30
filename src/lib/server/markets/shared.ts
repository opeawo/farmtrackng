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

	const postedAt =
		(typeof r.postedAt === 'string' && r.postedAt.trim().slice(0, 60)) || 'Recently';
	const postedAtMs = parsePostedAt(postedAt) ?? undefined;

	return {
		source: opts.source,
		title: r.title.trim().slice(0, 200),
		priceNgn: Math.round(r.priceNgn),
		unit,
		location: r.location.trim().slice(0, 100),
		postedAt,
		postedAtMs,
		url,
		category
	};
}

// Parse the wide variety of postedAt strings sources return ("Today",
// "Yesterday", "3 days ago", "2026-05-29", "May 29, 2026", "29 May") into an
// epoch-ms timestamp so the merged feed can be sorted strictly newest-first.
// Returns null when nothing reliable can be extracted.
export function parsePostedAt(raw: string, now: number = Date.now()): number | null {
	const trimmed = raw.trim();
	if (!trimmed) return null;

	const lower = trimmed.toLowerCase();

	if (lower === 'today' || lower === 'just now') return now;
	if (lower === 'yesterday') return now - 24 * 60 * 60 * 1000;

	// "X minute(s)/hour(s)/day(s)/week(s)/month(s)/year(s) ago"
	const relMatch = lower.match(
		/^(\d+)\s+(minute|hour|day|week|month|year)s?\s+ago$/
	);
	if (relMatch) {
		const n = parseInt(relMatch[1], 10);
		const unit = relMatch[2];
		const ms =
			unit === 'minute' ? 60_000
				: unit === 'hour' ? 60 * 60_000
				: unit === 'day' ? 24 * 60 * 60_000
				: unit === 'week' ? 7 * 24 * 60 * 60_000
				: unit === 'month' ? 30 * 24 * 60 * 60_000
				: 365 * 24 * 60 * 60_000;
		return now - n * ms;
	}

	// "an hour ago", "a day ago"
	const anMatch = lower.match(/^an?\s+(minute|hour|day|week|month|year)\s+ago$/);
	if (anMatch) {
		const unit = anMatch[1];
		const ms =
			unit === 'minute' ? 60_000
				: unit === 'hour' ? 60 * 60_000
				: unit === 'day' ? 24 * 60 * 60_000
				: unit === 'week' ? 7 * 24 * 60 * 60_000
				: unit === 'month' ? 30 * 24 * 60 * 60_000
				: 365 * 24 * 60 * 60_000;
		return now - ms;
	}

	// Try Date.parse on the original — handles "2026-05-29", "2026-05-29T...",
	// "May 29 2026", "29 May 2026", "May 29", etc.
	const parsed = Date.parse(trimmed);
	if (!Number.isNaN(parsed)) {
		// Sanity: don't accept dates more than 2 days in the future (clock skew
		// or AI hallucination) or more than 5 years in the past.
		const fiveYearsAgo = now - 5 * 365 * 24 * 60 * 60_000;
		const twoDaysAhead = now + 2 * 24 * 60 * 60_000;
		if (parsed >= fiveYearsAgo && parsed <= twoDaysAhead) return parsed;
	}

	return null;
}
