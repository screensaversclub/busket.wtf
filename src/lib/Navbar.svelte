<script>
	import { page } from '$app/stores';
	const currentPath = $page.url.pathname;
</script>

<nav><figure>🚌</figure></nav>

<style lang="postcss">
	nav {
		@apply bg-[transparent] flex gap-4 items-center justify-center p-2 border-b border-b-yellow-400 bg-yellow-200 h-12 flex-grow-0 flex-shrink-0;

		figure {
			@apply text-2xl;
		}
	}
</style>
