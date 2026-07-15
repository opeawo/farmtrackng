import type { PageLoad } from './$types';
import { unitForCategory, unitSuffix } from '$lib/markets/units';

// ISR: Vercel serves the cached page instantly and regenerates it in the
// background, so the Google Sheets fetch never blocks a visitor. allowQuery
// keeps the ?state/?type/?date SEO deep links as distinct cached variants;
// any other query param serves the base page.
export const config = {
	isr: {
		expiration: 900,
		allowQuery: ['state', 'type', 'date']
	}
};

// Client-safe mirror of the server's AggregatedPrice (do NOT import from
// $lib/server here — this load runs on the client too).
interface AggregatedPrice {
	product: string;
	category: string;
	state: string;
	unit: string;
	priceNgn: number;
	lowNgn?: number;
	highNgn?: number;
	confidence: number;
	sampleSize: number;
}

const CATEGORY_LABEL: Record<string, string> = {
	poultry: 'Poultry',
	cattle: 'Cattle',
	goat: 'Goat',
	sheep: 'Sheep',
	pig: 'Pig',
	fish: 'Fish',
	eggs: 'Eggs',
	feed: 'Feed',
	other: 'Livestock'
};

function ngn(n: number): string {
	return '₦' + n.toLocaleString('en-NG');
}

// Server-rendered so crawlers (and link unfurlers) see price-specific titles
// and descriptions for /markets?state=…&type=… deep links.
export const load: PageLoad = async ({ url, fetch }) => {
	const state = (url.searchParams.get('state') || '').trim();
	const type = (url.searchParams.get('type') || '').trim().toLowerCase();
	const date = (url.searchParams.get('date') || '').trim();

	let prices: AggregatedPrice[] = [];
	let fetchedAt = '';
	let stale = false;
	let degraded = false;
	let error: string | undefined;
	try {
		const res = await fetch('/api/markets/prices');
		const data = await res.json();
		prices = data.prices ?? [];
		fetchedAt = data.fetchedAt ?? '';
		stale = !!data.stale;
		degraded = !!data.degraded;
		error = data.error;
	} catch {
		error = 'Could not load prices.';
	}

	const detail =
		state && type
			? (prices.find(
					(p) => p.state.toLowerCase() === state.toLowerCase() && p.category === type
				) ?? null)
			: null;

	let seo: { title: string; description: string; canonicalPath: string; ogType?: 'article' };
	if (detail) {
		const range =
			detail.lowNgn && detail.highNgn
				? ` (typical ${ngn(detail.lowNgn)}–${ngn(detail.highNgn)})`
				: '';
		seo = {
			title: `${detail.product} price in ${detail.state} — ${ngn(detail.priceNgn)}${unitSuffix(detail.category)}`,
			description: `${detail.product} is ${ngn(detail.priceNgn)} ${unitForCategory(detail.category)} in ${detail.state}${range}, per the FarmPaddy livestock price index — modeled daily from field-agent market data across Nigeria.`,
			canonicalPath: `/markets?state=${encodeURIComponent(detail.state)}&type=${detail.category}`,
			ogType: 'article'
		};
	} else if (state) {
		seo = {
			title: `Livestock market prices in ${state}`,
			description: `Live livestock and poultry market prices in ${state}, Nigeria — per head or per kg by type, from the FarmPaddy price index.`,
			canonicalPath: `/markets?state=${encodeURIComponent(state)}`
		};
	} else if (type) {
		const label = CATEGORY_LABEL[type] ?? 'Livestock';
		seo = {
			title: `${label} market prices across Nigeria`,
			description: `${label} market prices ${unitForCategory(type)} by state across Nigeria, from the FarmPaddy livestock price index.`,
			canonicalPath: `/markets?type=${type}`
		};
	} else {
		seo = {
			title: 'Nigerian Livestock & Poultry Market Prices',
			description:
				"FarmPaddy's livestock and poultry price index for Nigeria — modeled daily from market data collected by our field agents nationwide. Cattle and goat prices per head, broilers, layers, sheep, pigs and more per kg, by state.",
			canonicalPath: '/markets'
		};
	}

	return { prices, fetchedAt, stale, degraded, error, q: { state, type, date }, detail, seo };
};
