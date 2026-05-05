// In-memory snapshot cache with 15-minute lazy refresh.
// On Vercel each cold-started function instance gets its own cache; that's fine
// — we just want to avoid hammering the Sheets API on every page view. The
// /loans/refresh endpoint is the authoritative force-refresh path for the admin.

import { fetchSheetSnapshot } from './sheets';
import type { SheetSnapshot } from './types';

const TTL_MS = 15 * 60 * 1000;

let snapshot: SheetSnapshot | null = null;
let lastFetched = 0;
let inflight: Promise<SheetSnapshot> | null = null;

export async function getSnapshot(opts: { force?: boolean } = {}): Promise<SheetSnapshot> {
	const now = Date.now();
	const fresh = snapshot && now - lastFetched < TTL_MS;
	if (fresh && !opts.force) return snapshot!;
	if (inflight) return inflight;

	inflight = fetchSheetSnapshot()
		.then((s) => {
			snapshot = s;
			lastFetched = Date.now();
			return s;
		})
		.finally(() => {
			inflight = null;
		});
	return inflight;
}

export function getCachedSnapshotInfo() {
	return {
		hasData: snapshot != null,
		lastFetched: lastFetched ? new Date(lastFetched).toISOString() : null,
		loanCount: snapshot?.loans.length ?? 0,
		installmentCount: snapshot?.installments.length ?? 0
	};
}
