// Admin-bookmarked force-refresh. /loans/refresh?key=XXX
// Bypasses the in-memory TTL by passing { force: true }.

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { getSnapshot, getCachedSnapshotInfo } from '$lib/server/loans/cache';

const { SYNC_ENDPOINT_KEY } = env;

export const GET: RequestHandler = async ({ url }) => {
	const key = url.searchParams.get('key');
	if (!SYNC_ENDPOINT_KEY || key !== SYNC_ENDPOINT_KEY) {
		return new Response('Forbidden', { status: 403 });
	}

	try {
		const snap = await getSnapshot({ force: true });
		return json({
			ok: true,
			fetched_at: snap.fetched_at,
			loan_count: snap.loans.length,
			installment_count: snap.installments.length,
			cache: getCachedSnapshotInfo()
		});
	} catch (err) {
		console.error('[loans/refresh] failed', err);
		return json({ ok: false, error: 'sheet fetch failed' }, { status: 502 });
	}
};
