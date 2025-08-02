<script>
	/// <reference types="vite-plugin-pwa/info" />
	import '../app.css';
	import Navbar from '$lib/Navbar.svelte';
	import { pwaInfo } from 'virtual:pwa-info';
	import { UmamiAnalytics } from '@lukulent/svelte-umami';
	$: webManifestLink = pwaInfo ? pwaInfo.webManifest.linkTag : '';
</script>

<svelte:head>
	{@html webManifestLink}
</svelte:head>

<div id="app-root">
	<div id="flex-wrapper">
		<Navbar />
		<slot />
	</div>

	<UmamiAnalytics
		websiteID="b009e657-7f2d-4e57-be06-caeaca951e86"
		srcURL="https://umami-production-6250.up.railway.app/script.js"
	/>
</div>

<style lang="postcss">
	:global(html) {
		@apply bg-[#FCF197];
	}
	div#flex-wrapper {
		@apply h-full fixed flex flex-col justify-start w-full bg-yellow-50;
	}
</style>
