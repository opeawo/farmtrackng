// Throwaway: seed random test prices for every state into the Prices tab.
// Run:  node --env-file=.env seed/seed-prices.mjs
//
// Reuses the app's Google service account (GOOGLE_SA_EMAIL / GOOGLE_SA_KEY).
// Every row is tagged with phone +2340000000000 so it can be bulk-deleted later.
// Column order matches getPriceRows/appendPriceRow:
//   TimestampWAT | Phone | State | Market | Livestock Type | PriceNgnPerKg

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { google } from 'googleapis';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SHEET_ID = process.env.MARKETS_SHEET_ID || '1zsAZFsPBRQgOzGwPf2U90irJIh59A1cnjvrGs-HT9gM';
const PRICES_TAB = (process.env.MARKETS_SHEET_PRICES_RANGE || 'Prices!A1:Z100000').split('!')[0];
const TAG_PHONE = '+2340000000000';
const ENTRIES_PER_PAIR = 5;

// Per-livestock ₦/kg bands (rough live-weight ranges).
const LIVESTOCK = [
	{ name: 'Cattle', min: 1800, max: 3200 },
	{ name: 'Goat', min: 2800, max: 4500 },
	{ name: 'Sheep', min: 2800, max: 4200 },
	{ name: 'Pig', min: 1500, max: 2600 },
	{ name: 'Poultry', min: 2500, max: 4200 }
];

function nowWat() {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone: 'Africa/Lagos',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false
	}).format(new Date());
	return parts.replace(', ', ' ');
}

function randInt(min, max) {
	return Math.round(min + Math.random() * (max - min));
}

function pick(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}

// Parse seed/markets.tsv → Map<state, market[]>
function loadMarkets() {
	const tsv = readFileSync(join(__dirname, 'markets.tsv'), 'utf8').trim().split('\n');
	const [, ...rows] = tsv; // drop header
	const byState = new Map();
	for (const line of rows) {
		const [state, market] = line.split('\t');
		if (!state || !market) continue;
		const list = byState.get(state.trim()) ?? [];
		list.push(market.trim());
		byState.set(state.trim(), list);
	}
	return byState;
}

function getClient() {
	const email = process.env.GOOGLE_SA_EMAIL;
	const key = (process.env.GOOGLE_SA_KEY ?? '').replace(/\\n/g, '\n');
	if (!email || !key) {
		throw new Error('Missing GOOGLE_SA_EMAIL / GOOGLE_SA_KEY. Run with: node --env-file=.env seed/seed-prices.mjs');
	}
	const auth = new google.auth.JWT({
		email,
		key,
		scopes: ['https://www.googleapis.com/auth/spreadsheets']
	});
	return google.sheets({ version: 'v4', auth });
}

async function main() {
	const ts = nowWat();
	const byState = loadMarkets();
	const rows = [];

	for (const [state, markets] of byState) {
		for (const lv of LIVESTOCK) {
			for (let i = 0; i < ENTRIES_PER_PAIR; i++) {
				rows.push([ts, TAG_PHONE, state, pick(markets), lv.name, randInt(lv.min, lv.max)]);
			}
		}
	}

	const sheets = getClient();
	await sheets.spreadsheets.values.append({
		spreadsheetId: SHEET_ID,
		range: `${PRICES_TAB}!A1`,
		valueInputOption: 'USER_ENTERED',
		insertDataOption: 'INSERT_ROWS',
		requestBody: { values: rows }
	});

	console.log(`wrote ${rows.length} rows across ${byState.size} states (tagged ${TAG_PHONE}, dated ${ts})`);
}

main().catch((err) => {
	console.error('seed failed:', err.message);
	process.exit(1);
});
