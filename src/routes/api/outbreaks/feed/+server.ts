// Personalised disease-outbreak feed for the farmer's area.
//
// Reads the accumulating Nigeria dataset from Supabase and tags each outbreak
// with how close it is to the requesting farmer. On the FIRST load of a new
// day it runs the internal refresh tool once (grounded Gemini → validated JSON
// → upsert), then serves; same-day loads read straight from the store with no
// Gemini call. The dataset accumulates — nothing is ever deleted.

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	type FeedOutbreak,
	type OutbreakFeed,
	type Proximity,
	type StoredOutbreak
} from '$lib/server/outbreaks/schema';
import { getOutbreaks, getLastRefresh } from '$lib/server/outbreaks/store';
import { runRefresh, isRefreshing } from '$lib/server/outbreaks/refresh';

interface FeedBody {
	state?: string;
	lga?: string;
	species?: string;
}

const SEVERITY_ORDER: Record<FeedOutbreak['severity'], number> = {
	urgent: 0,
	treat: 1,
	monitor: 2
};
const PROXIMITY_ORDER: Record<Proximity, number> = { your_lga: 0, your_state: 1, national: 2 };

function proximityFor(o: StoredOutbreak, state: string, lga?: string): Proximity {
	if (o.state.toLowerCase() !== state.toLowerCase()) return 'national';
	if (lga && o.lga && o.lga.toLowerCase() === lga.toLowerCase()) return 'your_lga';
	return 'your_state';
}

function isStale(last: Date | null): boolean {
	if (!last) return true;
	// Refresh once per calendar day (UTC).
	return last.toISOString().slice(0, 10) !== new Date().toISOString().slice(0, 10);
}

export const POST: RequestHandler = async ({ request }) => {
	let body: FeedBody;
	try {
		body = (await request.json()) as FeedBody;
	} catch {
		body = {};
	}

	const state = body.state?.trim();
	const lga = body.lga?.trim();
	if (!state) {
		return json({ error: 'Set your location first.' }, { status: 400 });
	}

	let stored = await getOutbreaks();
	const last = await getLastRefresh();

	// First load of a new day → run the internal tool once.
	if (isStale(last) && !isRefreshing()) {
		if (stored.length === 0) {
			// Nothing to show yet — block so this user gets data.
			try {
				await runRefresh();
				stored = await getOutbreaks();
			} catch (err) {
				console.error('[api/outbreaks/feed] refresh failed (cold)', err);
			}
		} else {
			// Serve yesterday's data immediately; refresh in the background for
			// the next visitor. Upserts are idempotent so this is safe.
			void runRefresh().catch((err) =>
				console.error('[api/outbreaks/feed] background refresh failed', err)
			);
		}
	}

	const outbreaks: FeedOutbreak[] = stored
		.map((o) => ({ ...o, proximity: proximityFor(o, state, lga) }))
		.sort(
			(a, b) =>
				PROXIMITY_ORDER[a.proximity] - PROXIMITY_ORDER[b.proximity] ||
				SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
		);

	const feed: OutbreakFeed = {
		outbreaks,
		generatedAt: new Date().toISOString(),
		insufficient: outbreaks.length === 0
	};
	return json(feed);
};
