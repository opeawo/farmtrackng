// Partner API-key verification for the public pricing API (/api/v1/*).
//
// Keys live in the `ApiKeys` tab of the markets Google Sheet (Key | Name |
// Active | Created) and are read through the same 5-min-cached service-account
// reader as the agent allowlist. Add a key = add a row; revoke = set Active to
// "no" (takes effect within the cache window). Generate a key with:
//
//   node -e "console.log('fp_live_' + require('crypto').randomBytes(16).toString('hex'))"

import { getApiKeys, sheetsConfigured, type ApiKeyRecord } from '$lib/server/markets/sheets';

export interface VerifiedKey {
	name: string;
}

/**
 * Resolve a raw API key to its partner record, or null if it is missing,
 * unknown, or disabled. Never throws — a Sheets outage returns null (deny)
 * rather than bubbling an error into the request.
 */
export async function verifyApiKey(raw: string | null | undefined): Promise<VerifiedKey | null> {
	const key = (raw ?? '').trim();
	if (!key || !sheetsConfigured) return null;

	let keys: Map<string, ApiKeyRecord>;
	try {
		keys = await getApiKeys();
	} catch (err) {
		console.error('[api/keys] could not read ApiKeys tab', err);
		return null;
	}

	const record = keys.get(key);
	if (!record || !record.active) return null;
	return { name: record.name };
}

/**
 * Pull the API key from a request: `X-API-Key: <key>` or
 * `Authorization: Bearer <key>`. Returns null if neither is present.
 */
export function readApiKey(headers: Headers): string | null {
	const direct = headers.get('x-api-key');
	if (direct && direct.trim()) return direct.trim();

	const auth = headers.get('authorization');
	if (auth) {
		const m = auth.match(/^Bearer\s+(.+)$/i);
		if (m) return m[1].trim();
	}
	return null;
}
