import type { Handle, HandleServerError } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { readApiKey, verifyApiKey } from '$lib/server/api/keys';
import { rateLimit } from '$lib/server/api/ratelimit';

const API_PREFIX = '/api/v1';

// CORS: the API is keyed, not cookie-authed, so any origin may call it — the
// key is the gate. Applied to every /api/v1 response and the OPTIONS preflight.
const CORS_HEADERS: Record<string, string> = {
	'access-control-allow-origin': '*',
	'access-control-allow-methods': 'GET, OPTIONS',
	'access-control-allow-headers': 'Authorization, X-API-Key, Content-Type',
	'access-control-max-age': '86400'
};

function withCors(res: Response): Response {
	for (const [k, v] of Object.entries(CORS_HEADERS)) res.headers.set(k, v);
	return res;
}

function errorJson(status: number, error: string, extra: Record<string, unknown> = {}): Response {
	return withCors(json({ error, ...extra }, { status }));
}

// Gate the public pricing API: CORS + preflight, API-key auth, best-effort
// rate limiting. Everything outside /api/v1 passes straight through.
export const handle: Handle = async ({ event, resolve }) => {
	if (!event.url.pathname.startsWith(API_PREFIX)) {
		return resolve(event);
	}

	// Preflight — answer before auth so browsers can send the key header.
	if (event.request.method === 'OPTIONS') {
		return withCors(new Response(null, { status: 204 }));
	}

	const key = readApiKey(event.request.headers);
	const verified = await verifyApiKey(key);
	if (!verified) {
		return errorJson(401, 'invalid_api_key', {
			message: 'Provide a valid API key via the X-API-Key header or Authorization: Bearer.'
		});
	}

	const limit = rateLimit(key as string);
	const rateHeaders: Record<string, string> = {
		'x-ratelimit-limit': String(limit.limit),
		'x-ratelimit-remaining': String(limit.remaining),
		'x-ratelimit-reset': String(Math.ceil(limit.resetAt / 1000))
	};
	if (!limit.ok) {
		const res = errorJson(429, 'rate_limited', {
			message: 'Too many requests. Slow down and retry shortly.'
		});
		for (const [k, v] of Object.entries(rateHeaders)) res.headers.set(k, v);
		res.headers.set('retry-after', String(Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000))));
		return res;
	}

	const response = await resolve(event);
	withCors(response);
	for (const [k, v] of Object.entries(rateHeaders)) response.headers.set(k, v);
	return response;
};

export const handleError: HandleServerError = async ({ error }) => {
	const errorId = crypto.randomUUID();
	// In production: initialize and use Sentry here
	// Sentry.captureException(error, { extra: { event, errorId } });

	console.error(`[${errorId}]`, error);

	return {
		message: 'An internal error occurred',
		errorId
	};
};
