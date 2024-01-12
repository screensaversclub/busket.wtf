<script>
	import '../app.css';
	import Navbar from '$lib/Navbar.svelte';
</script>

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
