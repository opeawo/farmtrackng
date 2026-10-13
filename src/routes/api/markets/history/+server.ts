// GET /api/markets/history — public historical price data (Historical Data page).
//
// Filters: from / to (YYYY-MM-DD, never before HISTORY_START), state, market,
// category, product, page (records are paged; the CSV has every record).
// format=csv streams the daily per-market records as a
// download. Built on the cleaned agent entries (10-min cache), so new field
// submissions flow in automatically.

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCleanHistoryRows, HISTORY_START } from '$lib/server/markets/history';
import {
	buildOptions,
	buildRecords,
	buildSummary,
	buildTrend,
	filterRows,
	recordsToCsv
} from '$lib/server/markets/history-query';
import { DATE_RE, todayWat } from '$lib/server/markets/dates';
import { LISTING_CATEGORIES } from '$lib/server/markets/types';
import type { ListingCategory } from '$lib/server/markets/types';
import type { HistoryFilters, HistoryResponse } from '$lib/markets/history-types';

const PAGE_SIZE = 50;
const EDGE_CACHE = 'public, s-maxage=300, stale-while-revalidate=3600';

export const GET: RequestHandler = async ({ url, setHeaders }) => {
	const param = (k: string) => url.searchParams.get(k)?.trim() ?? '';

	const fromParam = param('from');
	const toParam = param('to');
	if (fromParam && !DATE_RE.test(fromParam)) {
		return json({ error: 'invalid_query', message: '`from` must be YYYY-MM-DD.' }, { status: 400 });
	}
	if (toParam && !DATE_RE.test(toParam)) {
		return json({ error: 'invalid_query', message: '`to` must be YYYY-MM-DD.' }, { status: 400 });
	}
	const today = todayWat();
	const to = toParam && toParam < today ? toParam : today;
	const from = fromParam && fromParam > HISTORY_START ? fromParam : HISTORY_START;
	if (from > to) {
		return json({ error: 'invalid_query', message: '`from` must not be after `to`.' }, { status: 400 });
	}

	const category = param('category').toLowerCase();
	if (category && !LISTING_CATEGORIES.includes(category as ListingCategory)) {
		return json({ error: 'invalid_query', message: `Unknown category "${category}".` }, { status: 400 });
	}
	const filters: HistoryFilters = {
		state: param('state'),
		market: param('market'),
		category,
		product: param('product')
	};

	const { rows, fetchedAt, stale, error } = await getCleanHistoryRows();
	const scoped = filterRows(rows, { ...filters, from, to });
	const records = buildRecords(scoped);

	setHeaders({ 'cache-control': stale ? 'public, s-maxage=60' : EDGE_CACHE });

	if (param('format').toLowerCase() === 'csv') {
		const name = ['farmpaddy-livestock-prices', from, to].join('_');
		return new Response(recordsToCsv(records), {
			headers: {
				'content-type': 'text/csv; charset=utf-8',
				'content-disposition': `attachment; filename="${name}.csv"`
			}
		});
	}

	const page = Math.max(1, Math.min(Math.ceil(records.length / PAGE_SIZE) || 1, parseInt(param('page'), 10) || 1));
	const trend = buildTrend(scoped);
	// Headline figures for the chosen product, else the one with most entries.
	const focusProduct = filters.product || trend[0]?.product || '';
	const focusRows = focusProduct
		? scoped.filter((r) => r.product.toLowerCase() === focusProduct.toLowerCase())
		: [];
	const focus = buildSummary(focusRows, filters.state ? 'market' : 'state');

	const body: HistoryResponse = {
		from,
		to,
		fetchedAt,
		stale,
		...(error ? { error } : {}),
		filters,
		options: buildOptions(rows),
		entries: scoped.length,
		focus,
		trend: filters.product ? trend.slice(0, 1) : trend,
		records: records.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
		totalRecords: records.length,
		page,
		pageSize: PAGE_SIZE
	};
	return json(body, { status: rows.length === 0 && error ? 502 : 200 });
};
