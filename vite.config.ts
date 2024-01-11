import { sveltekit } from '@sveltejs/kit/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		VitePWA({
			registerType: 'autoUpdate',
			devOptions: { enabled: true },
			manifest: {
				theme_color: '#fcffcf',
				icons: [
					{
						src: 'favicon.png'
					}
				]
			}
		})
	]
});
