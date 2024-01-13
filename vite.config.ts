import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		SvelteKitPWA({
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
