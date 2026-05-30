import { writable } from 'svelte/store';
import { browser } from '$app/environment';

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

const USER_STORAGE_KEY = 'farmtrack:user';

function loadUser(): UserProfile | null {
	if (!browser) return null;
	try {
		const raw = localStorage.getItem(USER_STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as UserProfile;
		if (!parsed || typeof parsed !== 'object' || !parsed.id) return null;
		return parsed;
	} catch {
		return null;
	}
}

export const user = writable<UserProfile | null>(loadUser());

if (browser) {
	user.subscribe((value) => {
		try {
			if (value) localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(value));
			else localStorage.removeItem(USER_STORAGE_KEY);
		} catch {
			// localStorage full or disabled — ignore. In-memory store still works.
		}
	});
}

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
