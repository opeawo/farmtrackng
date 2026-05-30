// Tiny module-scoped TTL cache. Lives for the lifetime of a Vercel function
// instance — cold starts reset it. Good enough for "refresh once a day per
// instance" behavior; swap for Vercel KV when we want strict single-fetch.

export interface CacheEntry<T> {
	data: T;
	storedAt: number; // epoch ms
	expiresAt: number; // epoch ms
}

const store = new Map<string, CacheEntry<unknown>>();

export function get<T>(key: string): CacheEntry<T> | undefined {
	return store.get(key) as CacheEntry<T> | undefined;
}

export function set<T>(key: string, data: T, ttlMs: number): void {
	const now = Date.now();
	store.set(key, { data, storedAt: now, expiresAt: now + ttlMs });
}

export function isExpired<T>(entry: CacheEntry<T> | undefined): boolean {
	if (!entry) return true;
	return Date.now() > entry.expiresAt;
}
