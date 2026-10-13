// Pure query helpers for the public Historical Data endpoint. They work on the
// cleaned agent entries from getCleanHistoryRows() and aggregate on demand, so
// every filter combination is computed from raw prices (medians across markets
// are true medians, not medians of medians). Every figure goes through the same
// summarizePrices() as the live index.

import { summarizePrices, trimOutliers } from './aggregate';
import type { HistoryRow } from './history';
import type {
	BreakdownRow,
	HistoryFilters,
	HistoryOptions,
	HistoryRecord,
	ProductSummary,
	TrendSeries
} from '$lib/markets/history-types';
import { shiftDays } from './dates';

const lc = (s: string) => s.trim().toLowerCase();

/** Outlier-trimmed mean — the "average" shown alongside the median. */
export function averageOf(values: number[]): number {
	const kept = trimOutliers([...values].sort((a, b) => a - b));
	return Math.round(kept.reduce((s, v) => s + v, 0) / kept.length);
}

export function filterRows(
	rows: HistoryRow[],
	f: HistoryFilters & { from: string; to: string }
): HistoryRow[] {
	const state = lc(f.state);
	const market = lc(f.market);
	const category = lc(f.category);
	const product = lc(f.product);
	return rows.filter(
		(r) =>
			r.date >= f.from &&
			r.date <= f.to &&
			(!state || lc(r.state) === state) &&
			(!market || lc(r.market) === market) &&
			(!category || r.category === category) &&
			(!product || lc(r.product) === product)
	);
}

// Group rows by a key, keeping the first row seen as the display label source.
function groupBy(rows: HistoryRow[], key: (r: HistoryRow) => string) {
	const groups = new Map<string, { first: HistoryRow; rows: HistoryRow[] }>();
	for (const r of rows) {
		const k = key(r);
		const g = groups.get(k);
		if (g) g.rows.push(r);
		else groups.set(k, { first: r, rows: [r] });
	}
	return groups;
}

/** Daily records: one per date × state × market × product, newest first. */
export function buildRecords(rows: HistoryRow[]): HistoryRecord[] {
	const out: HistoryRecord[] = [];
	for (const { first, rows: g } of groupBy(
		rows,
		(r) => `${r.date}|${lc(r.state)}|${lc(r.market)}|${lc(r.product)}`
	).values()) {
		const values = g.map((r) => r.priceNgn);
		const stats = summarizePrices(values);
		out.push({
			date: first.date,
			state: first.state,
			market: first.market,
			category: first.category,
			product: first.product,
			unit: first.unit,
			priceNgn: stats.priceNgn,
			avgNgn: averageOf(values),
			lowNgn: stats.lowNgn,
			highNgn: stats.highNgn,
			sampleSize: stats.sampleSize,
			confidence: stats.confidence
		});
	}
	out.sort(
		(a, b) =>
			b.date.localeCompare(a.date) ||
			a.state.localeCompare(b.state) ||
			a.market.localeCompare(b.market) ||
			a.product.localeCompare(b.product)
	);
	return out;
}

/** Daily series per product (units differ, so never mixed), most entries first. */
export function buildTrend(rows: HistoryRow[], limit = 6): TrendSeries[] {
	const byProduct = [...groupBy(rows, (r) => lc(r.product)).values()].sort(
		(a, b) => b.rows.length - a.rows.length || a.first.product.localeCompare(b.first.product)
	);
	return byProduct.slice(0, limit).map(({ first, rows: g }) => {
		const points = [...groupBy(g, (r) => r.date).values()]
			.map(({ first: d, rows: day }) => {
				const values = day.map((r) => r.priceNgn);
				const stats = summarizePrices(values);
				return {
					date: d.date,
					priceNgn: stats.priceNgn,
					avgNgn: averageOf(values),
					lowNgn: stats.lowNgn,
					highNgn: stats.highNgn,
					sampleSize: stats.sampleSize
				};
			})
			.sort((a, b) => a.date.localeCompare(b.date));
		return { product: first.product, category: first.category, unit: first.unit, entries: g.length, points };
	});
}

/**
 * Headline figures for one product's rows: period average/median, latest
 * day, change between the first and last 7 days with data, coverage, and a
 * per-state (or per-market, once a state is chosen) breakdown.
 */
export function buildSummary(rows: HistoryRow[], breakdownBy: 'state' | 'market'): ProductSummary | null {
	if (rows.length === 0) return null;
	const first = rows[0];
	const values = rows.map((r) => r.priceNgn);
	const stats = summarizePrices(values);

	const dates = [...new Set(rows.map((r) => r.date))].sort();
	const firstDate = dates[0];
	const lastDate = dates[dates.length - 1];
	const latestDay = rows.filter((r) => r.date === lastDate).map((r) => r.priceNgn);

	// Compare the first and last 7-day windows only when they don't overlap.
	let changePct: number | null = null;
	const firstWindowEnd = shiftDays(firstDate, 6);
	const lastWindowStart = shiftDays(lastDate, -6);
	if (lastWindowStart > firstWindowEnd) {
		const early = rows.filter((r) => r.date <= firstWindowEnd).map((r) => r.priceNgn);
		const late = rows.filter((r) => r.date >= lastWindowStart).map((r) => r.priceNgn);
		const a = summarizePrices(early).priceNgn;
		const b = summarizePrices(late).priceNgn;
		if (a > 0) changePct = Math.round(((b - a) / a) * 1000) / 10;
	}

	const breakdown: BreakdownRow[] = [
		...groupBy(rows, (r) => lc(breakdownBy === 'state' ? r.state : r.market)).values()
	]
		.map(({ first: b, rows: g }) => {
			const v = g.map((r) => r.priceNgn);
			const s = summarizePrices(v);
			return {
				label: breakdownBy === 'state' ? b.state : b.market,
				avgNgn: averageOf(v),
				priceNgn: s.priceNgn,
				lowNgn: s.lowNgn,
				highNgn: s.highNgn,
				sampleSize: s.sampleSize
			};
		})
		.sort((a, b) => b.avgNgn - a.avgNgn);

	return {
		product: first.product,
		category: first.category,
		unit: first.unit,
		avgNgn: averageOf(values),
		medianNgn: stats.priceNgn,
		latestNgn: summarizePrices(latestDay).priceNgn,
		latestDate: lastDate,
		changePct,
		entries: rows.length,
		markets: new Set(rows.map((r) => `${lc(r.state)}|${lc(r.market)}`)).size,
		states: new Set(rows.map((r) => lc(r.state))).size,
		breakdownBy,
		breakdown
	};
}

/** Filter dropdown values — only states/markets/products that have data. */
export function buildOptions(rows: HistoryRow[]): HistoryOptions {
	const marketsByState: Record<string, Set<string>> = {};
	const productsByCategory: Record<string, Map<string, string>> = {};
	let firstDate: string | null = null;
	let lastDate: string | null = null;
	for (const r of rows) {
		(marketsByState[r.state] ??= new Set()).add(r.market);
		const products = (productsByCategory[r.category] ??= new Map());
		if (!products.has(lc(r.product))) products.set(lc(r.product), r.product);
		if (!firstDate || r.date < firstDate) firstDate = r.date;
		if (!lastDate || r.date > lastDate) lastDate = r.date;
	}
	const sorted = (xs: Iterable<string>) => [...xs].sort((a, b) => a.localeCompare(b));
	return {
		states: sorted(Object.keys(marketsByState)),
		marketsByState: Object.fromEntries(
			Object.entries(marketsByState).map(([s, m]) => [s, sorted(m)])
		),
		productsByCategory: Object.fromEntries(
			Object.entries(productsByCategory).map(([c, m]) => [c, sorted(m.values())])
		),
		firstDate,
		lastDate
	};
}

const CSV_COLUMNS = [
	'date',
	'state',
	'market',
	'category',
	'product',
	'unit',
	'median_ngn',
	'average_ngn',
	'low_ngn',
	'high_ngn',
	'entries',
	'confidence'
];

function csvCell(v: string | number): string {
	const s = String(v);
	// Quote anything with delimiters, and neutralise spreadsheet formula prefixes.
	const safe = /^[=+\-@]/.test(s) && typeof v === 'string' ? `'${s}` : s;
	return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function recordsToCsv(records: HistoryRecord[]): string {
	const lines = [CSV_COLUMNS.join(',')];
	for (const r of records) {
		lines.push(
			[
				r.date,
				r.state,
				r.market,
				r.category,
				r.product,
				r.unit,
				r.priceNgn,
				r.avgNgn,
				r.lowNgn,
				r.highNgn,
				r.sampleSize,
				r.confidence
			]
				.map(csvCell)
				.join(',')
		);
	}
	return lines.join('\r\n') + '\r\n';
}
