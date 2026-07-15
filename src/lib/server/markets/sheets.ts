// Google Sheets access for the livestock price index.
//
// The same Google service account used by the loan tracker (GOOGLE_SA_EMAIL /
// GOOGLE_SA_KEY) reads the reference tabs and appends agent price entries.
// Share the spreadsheet (MARKETS_SHEET_ID) with that service-account email.
//
// Tabs:
//   Agents    — Phone | State | Name            (submission allowlist)
//   Markets   — State | Market                  (one row per market)
//   Livestock — Livestock Type                  (one per row)
//   Prices    — TimestampWAT | Phone | State | Market | Livestock Type | PriceNgnPerKg
//               (the price column holds ₦ per head for cattle/goat rows, ₦ per kg otherwise)

import { google } from 'googleapis';
import { env } from '$env/dynamic/private';
import { normalisePhone, parseMoney } from '$lib/server/loans/normalise';
import * as cache from './cache';

const SHEET_ID = env.MARKETS_SHEET_ID || '1zsAZFsPBRQgOzGwPf2U90irJIh59A1cnjvrGs-HT9gM';
const AGENTS_RANGE = env.MARKETS_SHEET_AGENTS_RANGE || 'Agents!A1:Z2000';
const MARKETS_RANGE = env.MARKETS_SHEET_MARKETS_RANGE || 'Markets!A1:Z5000';
const LIVESTOCK_RANGE = env.MARKETS_SHEET_LIVESTOCK_RANGE || 'Livestock!A1:Z500';
const PRICES_RANGE = env.MARKETS_SHEET_PRICES_RANGE || 'Prices!A1:Z100000';
const PRICES_TAB = PRICES_RANGE.split('!')[0];

const REF_TTL_MS = 5 * 60 * 1000; // reference tabs: refresh every 5 min

export const sheetsConfigured = !!env.GOOGLE_SA_EMAIL && !!env.GOOGLE_SA_KEY && !!SHEET_ID;

function getClient() {
	if (!sheetsConfigured) {
		throw new Error(
			'Google Sheets credentials missing. Set GOOGLE_SA_EMAIL, GOOGLE_SA_KEY, MARKETS_SHEET_ID.'
		);
	}
	const auth = new google.auth.JWT({
		email: env.GOOGLE_SA_EMAIL,
		// Vercel envs escape newlines; un-escape them.
		key: (env.GOOGLE_SA_KEY ?? '').replace(/\\n/g, '\n'),
		scopes: ['https://www.googleapis.com/auth/spreadsheets']
	});
	return google.sheets({ version: 'v4', auth });
}

// Header row → snake_case keys, body rows → objects. Mirrors the loan tracker.
function rowsToObjects(rows: unknown[][] | null | undefined): Record<string, string>[] {
	if (!rows || rows.length === 0) return [];
	const [header, ...body] = rows;
	const headers = header.map((h) =>
		String(h || '')
			.trim()
			.toLowerCase()
			.replace(/[\s\-/]+/g, '_')
			.replace(/[^a-z0-9_]/g, '')
	);
	return body
		.filter((r) => r && r.some((c) => c != null && String(c).trim() !== ''))
		.map((r) => {
			const obj: Record<string, string> = {};
			headers.forEach((h, i) => {
				obj[h] = r[i] == null ? '' : String(r[i]).trim();
			});
			return obj;
		});
}

function pick(obj: Record<string, string>, ...keys: string[]): string {
	for (const k of keys) {
		if (obj[k] != null && obj[k] !== '') return obj[k];
	}
	return '';
}

async function getRows(range: string): Promise<Record<string, string>[]> {
	const sheets = getClient();
	const res = await sheets.spreadsheets.values.get({
		spreadsheetId: SHEET_ID,
		range,
		valueRenderOption: 'UNFORMATTED_VALUE',
		dateTimeRenderOption: 'FORMATTED_STRING'
	});
	return rowsToObjects(res.data.values as unknown[][]);
}

async function cachedRows(key: string, range: string): Promise<Record<string, string>[]> {
	const existing = cache.get<Record<string, string>[]>(key);
	if (existing && !cache.isExpired(existing)) return existing.data;
	const rows = await getRows(range);
	cache.set(key, rows, REF_TTL_MS);
	return rows;
}

export interface AgentRecord {
	state: string;
	name: string;
}

/** Allowlisted agents keyed by normalised phone (+234XXXXXXXXXX). */
export async function getAgents(): Promise<Map<string, AgentRecord>> {
	const rows = await cachedRows('markets:agents', AGENTS_RANGE);
	const map = new Map<string, AgentRecord>();
	for (const r of rows) {
		const phone = normalisePhone(pick(r, 'phone', 'phone_number', 'mobile', 'msisdn'));
		const state = pick(r, 'state', 'state_name');
		if (!phone || !state) continue;
		map.set(phone, { state, name: pick(r, 'name', 'agent', 'agent_name') });
	}
	return map;
}

/** Markets grouped by state name. */
export async function getMarketsByState(): Promise<Map<string, string[]>> {
	const rows = await cachedRows('markets:markets', MARKETS_RANGE);
	const map = new Map<string, string[]>();
	for (const r of rows) {
		const state = pick(r, 'state', 'state_name');
		const market = pick(r, 'market', 'market_name', 'name');
		if (!state || !market) continue;
		const list = map.get(state) ?? [];
		if (!list.includes(market)) list.push(market);
		map.set(state, list);
	}
	return map;
}

/** Canonical livestock/product types agents can submit. */
export async function getLivestockTypes(): Promise<string[]> {
	const rows = await cachedRows('markets:livestock', LIVESTOCK_RANGE);
	const out: string[] = [];
	for (const r of rows) {
		const type = pick(r, 'livestock_type', 'livestock', 'type', 'product', 'name');
		if (type && !out.includes(type)) out.push(type);
	}
	return out;
}

export interface PriceRow {
	timestampWat: string;
	state: string;
	market: string;
	product: string;
	priceNgn: number;
}

/**
 * Raw agent price entries (used by the aggregator only — never sent to clients).
 * Read by FIXED column position in the order appendPriceRow writes them:
 *   [TimestampWAT, Phone, State, Market, Livestock Type, PriceNgnPerKg]
 * (price is ₦ per head for cattle/goat rows, ₦ per kg for everything else)
 * This way the Prices tab needs no header row, and a header row (if present) is
 * skipped automatically because its price cell is not numeric.
 */
export async function getPriceRows(): Promise<PriceRow[]> {
	const sheets = getClient();
	const res = await sheets.spreadsheets.values.get({
		spreadsheetId: SHEET_ID,
		range: PRICES_RANGE,
		valueRenderOption: 'UNFORMATTED_VALUE',
		dateTimeRenderOption: 'FORMATTED_STRING'
	});
	const rows = (res.data.values as unknown[][] | undefined) ?? [];
	const out: PriceRow[] = [];
	for (const r of rows) {
		if (!r) continue;
		const state = String(r[2] ?? '').trim();
		const product = String(r[4] ?? '').trim();
		const priceNgn = parseMoney(r[5]);
		if (!product || !state || priceNgn < 100) continue; // skips header/blank rows
		out.push({
			timestampWat: String(r[0] ?? '').trim(),
			state,
			market: String(r[3] ?? '').trim(),
			product,
			priceNgn
		});
	}
	return out;
}

/** Append one agent entry to the Prices tab. */
export async function appendPriceRow(values: (string | number)[]): Promise<void> {
	const sheets = getClient();
	await sheets.spreadsheets.values.append({
		spreadsheetId: SHEET_ID,
		range: `${PRICES_TAB}!A1`,
		valueInputOption: 'USER_ENTERED',
		insertDataOption: 'INSERT_ROWS',
		requestBody: { values: [values] }
	});
}

export { normalisePhone };
