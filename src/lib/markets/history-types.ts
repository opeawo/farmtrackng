// Client-safe shapes for the public Historical Data endpoint
// (GET /api/markets/history). Shared by the server and the /markets/history
// page — must not import anything from $lib/server.

import type { ListingCategory } from './units';

/** One day × state × market × product record (also the CSV row). */
export interface HistoryRecord {
	date: string; // YYYY-MM-DD (WAT)
	state: string;
	market: string;
	category: ListingCategory;
	product: string;
	unit: string;
	priceNgn: number; // outlier-trimmed median
	avgNgn: number; // outlier-trimmed mean
	lowNgn: number;
	highNgn: number;
	sampleSize: number; // agent entries
	confidence: number; // 0–100
}

export interface TrendPoint {
	date: string;
	priceNgn: number;
	avgNgn: number;
	lowNgn: number;
	highNgn: number;
	sampleSize: number;
}

export interface TrendSeries {
	product: string;
	category: ListingCategory;
	unit: string;
	entries: number;
	points: TrendPoint[]; // oldest → newest
}

export interface BreakdownRow {
	label: string; // state or market name
	avgNgn: number;
	priceNgn: number;
	lowNgn: number;
	highNgn: number;
	sampleSize: number;
}

export interface ProductSummary {
	product: string;
	category: ListingCategory;
	unit: string;
	avgNgn: number; // period average (outlier-trimmed mean)
	medianNgn: number; // period median
	latestNgn: number; // most recent day's median
	latestDate: string;
	changePct: number | null; // first-7-days median → last-7-days median
	entries: number;
	markets: number;
	states: number;
	breakdownBy: 'state' | 'market';
	breakdown: BreakdownRow[];
}

export interface HistoryOptions {
	states: string[];
	marketsByState: Record<string, string[]>;
	productsByCategory: Record<string, string[]>;
	firstDate: string | null;
	lastDate: string | null;
}

export interface HistoryFilters {
	state: string;
	market: string;
	category: string;
	product: string;
}

export interface HistoryResponse {
	from: string;
	to: string;
	fetchedAt: string;
	stale: boolean;
	error?: string;
	filters: HistoryFilters;
	options: HistoryOptions;
	entries: number; // raw agent entries in scope
	focus: ProductSummary | null;
	trend: TrendSeries[];
	records: HistoryRecord[]; // one page, newest first
	totalRecords: number;
	page: number;
	pageSize: number;
}
