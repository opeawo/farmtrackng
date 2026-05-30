// Reverse-geocode lat/lng → Nigerian state + LGA via Mapbox.
//
// Uses the same PUBLIC_MAPBOX_TOKEN the client already has (Mapbox geocoding
// accepts pk.* tokens). Server-side so we can normalise the response and avoid
// exposing the call from the client.

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env as publicEnv } from '$env/dynamic/public';

interface MapboxFeature {
	id: string;
	place_type: string[];
	text: string;
	place_name: string;
}

interface MapboxGeocodeResponse {
	features?: MapboxFeature[];
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

	const token = publicEnv.PUBLIC_MAPBOX_TOKEN;
	if (!token || token === 'placeholder') {
		return json(
			{ error: 'Reverse geocoding is not configured.' },
			{ status: 503 }
		);
	}

	const url =
		`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json` +
		`?access_token=${encodeURIComponent(token)}` +
		`&country=ng&types=region,district,place,locality&limit=5&language=en`;

	let mapbox: MapboxGeocodeResponse;
	try {
		const res = await fetch(url);
		if (!res.ok) {
			console.error('[api/geocode] Mapbox returned', res.status);
			return json({ error: 'Reverse geocoding failed.' }, { status: 502 });
		}
		mapbox = (await res.json()) as MapboxGeocodeResponse;
	} catch (err) {
		console.error('[api/geocode] fetch failed', err);
		return json({ error: 'Reverse geocoding failed.' }, { status: 502 });
	}

	const features = mapbox.features ?? [];
	// In Nigeria Mapbox returns: region = State, district = LGA (Local Govt Area).
	const stateFeature = features.find((f) => f.place_type.includes('region'));
	const lgaFeature = features.find((f) =>
		f.place_type.some((t) => t === 'district' || t === 'locality' || t === 'place')
	);

	return json({
		state: stateFeature?.text ?? null,
		lga: lgaFeature?.text ?? null,
		lat,
		lng
	});
};
