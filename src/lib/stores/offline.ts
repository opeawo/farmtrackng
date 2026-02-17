import { readable } from 'svelte/store';
import { browser } from '$app/environment';

export const isOnline = readable(true, (set) => {
	if (!browser) return;

	set(navigator.onLine);

	const handleOnline = () => set(true);
	const handleOffline = () => set(false);

	window.addEventListener('online', handleOnline);
	window.addEventListener('offline', handleOffline);

	return () => {
		window.removeEventListener('online', handleOnline);
		window.removeEventListener('offline', handleOffline);
	};
});
