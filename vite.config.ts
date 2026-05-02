import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			manifest: {
				name: 'Busket',
				short_name: 'Busket',
				description: 'faster bus app',
				theme_color: '#fcf197',
				icons: [
					{
						src: 'favicon.png',
						sizes: '192x192',
						type: 'image/png'
					},

					{
						src: 'favicon.png',
						sizes: '512x512',
						type: 'image/png'
					}
				]
			},
			workbox: {
				globPatterns: ['client/**/*.{js,css,ico,png,svg,webp,woff,woff2}'],
				runtimeCaching: [
					{
						urlPattern: ({ url }) => url.pathname.startsWith('/api/bus-stop-arrival/'),
						handler: 'StaleWhileRevalidate',
						options: {
							cacheName: 'bus-arrivals',
							expiration: {
								maxEntries: 200,
								maxAgeSeconds: 60
							},
							cacheableResponse: { statuses: [0, 200] }
						}
					},
					{
						urlPattern: ({ url }) => url.pathname === '/api/stops-manifest',
						handler: 'StaleWhileRevalidate',
						options: {
							cacheName: 'stops-manifest',
							expiration: {
								maxEntries: 1,
								maxAgeSeconds: 60 * 60 * 24
							},
							cacheableResponse: { statuses: [0, 200] }
						}
					}
				]
			}
		})
		/*
		VitePWA({
			registerType: 'autoUpdate',
			// devOptions: { enabled: process.env.NODE_ENV !== 'production' },
			manifest: {
				name: 'Busket',
				description: 'faster bus app',
				theme_color: '#fcf197',
				icons: [
					{
						src: 'favicon.png',
						sizes: '192x192',
						type: 'image/png'
					},

					{
						src: 'favicon.png',
						sizes: '512x512',
						type: 'image/png'
					}
				]
			}
		})
		*/
	]
});
