// Reverse-geocode lat/lng → Nigerian state + LGA via OpenStreetMap Nominatim.
//
// Free, no API key. Nominatim's ToS requires a stable User-Agent identifying
// the app; we set one below. Rate limit: 1 request/sec per IP — fine for our
// volume since the result is persisted client-side in the user store.

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface NominatimResponse {
	address?: {
		state?: string;
		county?: string;
		city?: string;
		town?: string;
		village?: string;
		municipality?: string;
		suburb?: string;
		region?: string;
		state_district?: string;
	};
}

const NOMINATIM_UA = 'FarmPaddy/1.0 (https://farmpaddy.com; hello@livestockfunds.com)';

// Nominatim sometimes returns "Lagos State" — strip the trailing word so the
// label matches our own data ("Lagos"). FCT becomes "Abuja FCT".
function cleanState(state: string | null | undefined): string | null {
	if (!state) return null;
	const trimmed = state
		.replace(/\bState\b\s*$/i, '')
		.replace(/^Federal Capital Territory$/i, 'Abuja FCT')
		.trim();
	return trimmed || null;
}

// Strip "Local Government Area" / "LGA" suffix when present.
function cleanLga(lga: string | null | undefined): string | null {
	if (!lga) return null;
	const trimmed = lga
		.replace(/\bLocal Government Area\b\s*$/i, '')
		.replace(/\bLGA\b\s*$/i, '')
		.trim();
	return trimmed || null;
}

export const POST: RequestHandler = async ({ request }) => {
	let body: { lat?: number; lng?: number };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	const { lat, lng } = body;
	if (
		typeof lat !== 'number' ||
		typeof lng !== 'number' ||
		!Number.isFinite(lat) ||
		!Number.isFinite(lng)
	) {
		return json({ error: 'lat and lng (numbers) are required' }, { status: 400 });
	}

	const url =
		`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}` +
		`&addressdetails=1&zoom=10&accept-language=en`;

	try {
		const res = await fetch(url, {
			headers: { 'User-Agent': NOMINATIM_UA, Referer: 'https://farmpaddy.com' }
		});
		if (!res.ok) {
			console.error('[api/geocode] Nominatim returned', res.status);
			return json({ error: 'Reverse geocoding failed.' }, { status: 502 });
		}
		const data = (await res.json()) as NominatimResponse;
		const a = data.address ?? {};
		const state = cleanState(a.state ?? a.region);
		// LGA can land in `county`, `state_district`, or fall back to a city/town/village name.
		const lga = cleanLga(
			a.county ?? a.state_district ?? a.city ?? a.town ?? a.municipality ?? a.village
		);

		return json({ state, lga, lat, lng });
	} catch (err) {
		console.error('[api/geocode] fetch failed', err);
		return json({ error: 'Reverse geocoding failed.' }, { status: 502 });
	}
};
