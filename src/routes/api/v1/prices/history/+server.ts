// GET /api/v1/prices/history — daily price history (authenticated).
//
// Filters: state, product, category (shared) + from / to (YYYY-MM-DD).
// Defaults to the last 90 days when no range is given.

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPriceHistory } from '$lib/server/markets/history';
import { filterPrices, isFilterError } from '$lib/server/api/filters';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_WINDOW_DAYS = 90;

function todayWat(): string {
	return new Intl.DateTimeFormat('en-CA', {
		timeZone: 'Africa/Lagos',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).format(new Date());
}

function shiftDays(date: string, delta: number): string {
	const d = new Date(`${date}T00:00:00Z`);
	d.setUTCDate(d.getUTCDate() + delta);
	return d.toISOString().slice(0, 10);
}

export const GET: RequestHandler = async ({ url, setHeaders }) => {
	const fromParam = url.searchParams.get('from')?.trim();
	const toParam = url.searchParams.get('to')?.trim();

	if (fromParam && !DATE_RE.test(fromParam)) {
		return json({ error: 'invalid_query', message: '`from` must be YYYY-MM-DD.' }, { status: 400 });
	}
	if (toParam && !DATE_RE.test(toParam)) {
		return json({ error: 'invalid_query', message: '`to` must be YYYY-MM-DD.' }, { status: 400 });
	}

	const to = toParam || todayWat();
	const from = fromParam || shiftDays(to, -DEFAULT_WINDOW_DAYS);
	if (from > to) {
		return json({ error: 'invalid_query', message: '`from` must not be after `to`.' }, { status: 400 });
	}

	const { history, cacheControl, status } = await getPriceHistory();

	const matched = filterPrices(history.prices, url);
	if (isFilterError(matched)) {
		return json({ error: 'invalid_query', message: matched.error }, { status: 400 });
	}

	const prices = matched.filter((p) => p.date >= from && p.date <= to);

	setHeaders({ 'cache-control': cacheControl });
	return json(
		{
			from,
			to,
			count: prices.length,
			degraded: history.degraded,
			stale: history.stale,
			...(history.error ? { notice: history.error } : {}),
			prices
		},
		{ status }
	);
};
