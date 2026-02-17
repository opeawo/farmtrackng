import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			manifest: false,
			injectRegister: null,
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/api\.mapbox\.com\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'mapbox-cache',
							expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 }
						}
					}
				]
			},
			devOptions: {
				enabled: false
			}
		})
	]
});
