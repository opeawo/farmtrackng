import { writable } from 'svelte/store';

export interface UserProfile {
	id: string;
	fullName: string;
	phone: string;
	state: string;
	lga: string;
	lat: number | null;
	lng: number | null;
	whatsappOptedIn: boolean;
	onboarded: boolean;
}

export const user = writable<UserProfile | null>(null);

export const userLocation = writable<{ lat: number; lng: number } | null>(null);

export function requestLocation(): Promise<{ lat: number; lng: number }> {
	return new Promise((resolve, reject) => {
		if (!navigator.geolocation) {
			reject(new Error('Geolocation not supported'));
			return;
		}
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
				userLocation.set(loc);
				resolve(loc);
			},
			(err) => reject(err),
			{ enableHighAccuracy: false, timeout: 10000 }
		);
	});
}
