<script>
	/// <reference types="vite-plugin-pwa/info" />
	import '../app.css';
	import Navbar from '$lib/Navbar.svelte';
	import { pwaInfo } from 'virtual:pwa-info';
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
</div>

<style lang="postcss">
	:global(html) {
		@apply bg-[#FCF197];
	}
	div#flex-wrapper {
		@apply h-full fixed flex flex-col justify-start w-full bg-yellow-50;
	}
</style>
