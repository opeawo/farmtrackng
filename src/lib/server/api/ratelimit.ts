// Best-effort per-key rate limiter for the public API. Fixed-window counter in
// module memory — NOT authoritative across the Vercel fleet (each function
// instance keeps its own window and cold starts reset it). Enough to stop a
// single runaway client; documented as best-effort. Swap for Vercel KV when we
// need strict global limits.

interface Bucket {
	count: number;
	resetAt: number; // epoch ms when the window rolls over
}

const buckets = new Map<string, Bucket>();

const LIMIT = 120; // requests
const WINDOW_MS = 60_000; // per minute

export interface RateResult {
	ok: boolean;
	limit: number;
	remaining: number;
	resetAt: number; // epoch ms
}

export function rateLimit(key: string): RateResult {
	const now = Date.now();
	let b = buckets.get(key);
	if (!b || now >= b.resetAt) {
		b = { count: 0, resetAt: now + WINDOW_MS };
		buckets.set(key, b);
	}
	b.count += 1;
	return {
		ok: b.count <= LIMIT,
		limit: LIMIT,
		remaining: Math.max(0, LIMIT - b.count),
		resetAt: b.resetAt
	};
}
