// Reverse-geocode lat/lng → Nigerian state + LGA.
//
// Tries Mapbox first when PUBLIC_MAPBOX_TOKEN is set (better Nigerian admin
// boundaries). Falls back to OpenStreetMap Nominatim — free, no key — when
// Mapbox isn't configured or fails. Nominatim's ToS requires a stable
// User-Agent identifying the app; we set one below.

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env as publicEnv } from '$env/dynamic/public';

interface GeocodeResult {
	state: string | null;
	lga: string | null;
}

interface MapboxFeature {
	id: string;
	place_type: string[];
	text: string;
	place_name: string;
}

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

const NOMINATIM_UA = 'FarmTrack/1.0 (https://farmtrack.ng; hello@livestockfunds.com)';

async function geocodeViaMapbox(lat: number, lng: number, token: string): Promise<GeocodeResult | null> {
	const url =
		`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json` +
		`?access_token=${encodeURIComponent(token)}` +
		`&country=ng&types=region,district,place,locality&limit=5&language=en`;
	try {
		const res = await fetch(url);
		if (!res.ok) {
			console.warn('[api/geocode] Mapbox returned', res.status);
			return null;
		}
		const data = (await res.json()) as { features?: MapboxFeature[] };
		const features = data.features ?? [];
		const stateFeature = features.find((f) => f.place_type.includes('region'));
		const lgaFeature = features.find((f) =>
			f.place_type.some((t) => t === 'district' || t === 'locality' || t === 'place')
		);
		// In Nigeria Mapbox returns region = State, district = LGA.
		return {
			state: stateFeature?.text ?? null,
			lga: lgaFeature?.text ?? null
		};
	} catch (err) {
		console.warn('[api/geocode] Mapbox fetch failed', err);
		return null;
	}
}

async function geocodeViaNominatim(lat: number, lng: number): Promise<GeocodeResult | null> {
	const url =
		`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}` +
		`&addressdetails=1&zoom=10&accept-language=en`;
	try {
		const res = await fetch(url, {
			headers: { 'User-Agent': NOMINATIM_UA, Referer: 'https://farmtrack.ng' }
		});
		if (!res.ok) {
			console.warn('[api/geocode] Nominatim returned', res.status);
			return null;
		}
		const data = (await res.json()) as NominatimResponse;
		const a = data.address ?? {};
		// Nominatim's `state` is the Nigerian state; LGA can land in `county`,
		// `state_district`, or fall back to city/town/village.
		const rawState = a.state ?? a.region ?? null;
		const rawLga =
			a.county ?? a.state_district ?? a.city ?? a.town ?? a.municipality ?? a.village ?? null;
		return {
			state: cleanState(rawState),
			lga: cleanLga(rawLga)
		};
	} catch (err) {
		console.warn('[api/geocode] Nominatim fetch failed', err);
		return null;
	}
}

// Nominatim sometimes returns "Lagos State" — strip the trailing word so the
// label matches our own data ("Lagos"). Federal Capital Territory becomes "Abuja FCT".
function cleanState(state: string | null): string | null {
	if (!state) return null;
	const trimmed = state
		.replace(/\bState\b\s*$/i, '')
		.replace(/^Federal Capital Territory$/i, 'Abuja FCT')
		.trim();
	return trimmed || null;
}

// Strip the trailing "Local Government Area" / "LGA" suffix when present.
function cleanLga(lga: string | null): string | null {
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

	const mapboxToken = publicEnv.PUBLIC_MAPBOX_TOKEN;
	const useMapbox = mapboxToken && mapboxToken !== 'placeholder';

	let result: GeocodeResult | null = null;

	if (useMapbox) {
		result = await geocodeViaMapbox(lat, lng, mapboxToken);
	}

	if (!result) {
		result = await geocodeViaNominatim(lat, lng);
	}

	if (!result) {
		return json({ error: 'Reverse geocoding failed.' }, { status: 502 });
	}

	return json({ state: result.state, lga: result.lga, lat, lng });
};
