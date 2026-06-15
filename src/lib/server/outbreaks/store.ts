// Persistence for the accumulating Nigeria outbreak dataset.
//
// Tables (run once in Supabase SQL editor):
//
//   create table if not exists outbreaks (
//     key          text primary key,
//     disease      text not null,
//     species      text not null,
//     state        text not null,
//     lga          text,
//     severity     text not null,
//     summary      text not null,
//     date_posted  text not null,
//     source       text not null,
//     source_url   text not null,
//     added_at     timestamptz not null default now(),
//     last_seen    timestamptz not null default now()
//   );
//
//   create table if not exists app_meta (
//     key   text primary key,
//     value text
//   );
//
// "Keep everything": rows are never deleted — upsert refreshes last_seen and
// leaves added_at (the original "date posted to the app") untouched.

import { supabaseAdmin } from '$lib/server/supabase';
import { outbreakKey, type Outbreak, type StoredOutbreak } from './schema';

const LAST_REFRESH_KEY = 'outbreaks_last_refresh';

interface OutbreakRow {
	key: string;
	disease: string;
	species: string;
	state: string;
	lga: string | null;
	severity: string;
	summary: string;
	date_posted: string;
	source: string;
	source_url: string;
	added_at: string;
}

function rowToStored(r: OutbreakRow): StoredOutbreak {
	return {
		disease: r.disease,
		species: r.species as StoredOutbreak['species'],
		state: r.state,
		lga: r.lga,
		severity: r.severity as StoredOutbreak['severity'],
		summary: r.summary,
		datePosted: r.date_posted,
		source: r.source as StoredOutbreak['source'],
		sourceUrl: r.source_url,
		addedAt: r.added_at
	};
}

/** All stored outbreaks, newest-added first. Returns [] if DB is unavailable. */
export async function getOutbreaks(): Promise<StoredOutbreak[]> {
	if (!supabaseAdmin) return [];
	const { data, error } = await supabaseAdmin
		.from('outbreaks')
		.select('*')
		.order('added_at', { ascending: false });
	if (error) {
		console.error('[outbreaks/store] read failed', error.message);
		return [];
	}
	return (data as OutbreakRow[]).map(rowToStored);
}

/**
 * Upsert outbreaks by their dedup key. New rows are inserted (added_at = now);
 * existing rows just have last_seen refreshed — nothing is ever deleted.
 * Returns how many rows were written (best-effort).
 */
export async function upsertOutbreaks(items: Outbreak[]): Promise<number> {
	if (!supabaseAdmin || items.length === 0) return 0;
	const now = new Date().toISOString();
	const rows = items.map((o) => ({
		key: outbreakKey(o),
		disease: o.disease,
		species: o.species,
		state: o.state,
		lga: o.lga,
		severity: o.severity,
		summary: o.summary,
		date_posted: o.datePosted,
		source: o.source,
		source_url: o.sourceUrl,
		last_seen: now
		// added_at is intentionally omitted: the DB default sets it on first
		// insert, and ignoreDuplicates/merge preserves it on later upserts.
	}));
	const { error } = await supabaseAdmin
		.from('outbreaks')
		.upsert(rows, { onConflict: 'key', ignoreDuplicates: false });
	if (error) {
		console.error('[outbreaks/store] upsert failed', error.message);
		return 0;
	}
	return rows.length;
}

export async function getLastRefresh(): Promise<Date | null> {
	if (!supabaseAdmin) return null;
	const { data, error } = await supabaseAdmin
		.from('app_meta')
		.select('value')
		.eq('key', LAST_REFRESH_KEY)
		.maybeSingle();
	if (error || !data?.value) return null;
	const d = new Date(data.value);
	return isNaN(d.getTime()) ? null : d;
}

export async function setLastRefresh(when: Date): Promise<void> {
	if (!supabaseAdmin) return;
	const { error } = await supabaseAdmin
		.from('app_meta')
		.upsert({ key: LAST_REFRESH_KEY, value: when.toISOString() }, { onConflict: 'key' });
	if (error) console.error('[outbreaks/store] marker write failed', error.message);
}
