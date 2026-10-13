import type { PageLoad } from './$types';
import type { HistoryResponse } from '$lib/markets/history-types';

// Filters live in the URL (from, to, state, market, category, product, page)
// so every view is shareable and server-rendered. The API is edge-cached, so
// no ISR here — fresh agent entries surface within the API's short cache.
const PASS_THROUGH = ['from', 'to', 'state', 'market', 'category', 'product', 'page'];

// Canonical keeps only the subject filters — date range and paging are views.
function canonical(url: URL): string {
	const params = new URLSearchParams();
	for (const k of ['state', 'market', 'category', 'product']) {
		const v = url.searchParams.get(k)?.trim();
		if (v) params.set(k, v);
	}
	const qs = params.toString();
	return `/markets/history${qs ? `?${qs}` : ''}`;
}

export const load: PageLoad = async ({ url, fetch }) => {
	const params = new URLSearchParams();
	for (const k of PASS_THROUGH) {
		const v = url.searchParams.get(k)?.trim();
		if (v) params.set(k, v);
	}
	const qs = params.toString();

	let history: HistoryResponse | null = null;
	let error: string | undefined;
	try {
		const res = await fetch(`/api/markets/history${qs ? `?${qs}` : ''}`);
		const body = await res.json();
		if (res.ok || body?.options) history = body as HistoryResponse;
		else error = body?.message ?? 'Could not load price history.';
	} catch {
		error = 'Could not load price history.';
	}

	const state = url.searchParams.get('state')?.trim() ?? '';
	const product = url.searchParams.get('product')?.trim() ?? '';
	const subject = [product || 'Livestock', 'price history', state ? `in ${state}` : 'in Nigeria'].join(' ');

	return {
		history,
		error,
		qs,
		seo: {
			title: subject.charAt(0).toUpperCase() + subject.slice(1),
			description: `Daily ${product ? product.toLowerCase() : 'livestock and poultry'} market prices${state ? ` in ${state}` : ' across Nigeria'} since July 2026 — trends, averages and downloadable records from the FarmPaddy price index, updated automatically from field-agent market data.`,
			canonicalPath: canonical(url)
		}
	};
};
