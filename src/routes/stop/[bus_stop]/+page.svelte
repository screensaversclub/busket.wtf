<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { BusStop, BusStopArrival } from '$lib/lta-payload-types';
	import NextbusSlot from './nextbus_slot.svelte';
	import { favs } from '$lib/favs-store';
	import { trackEvent } from '@lukulent/svelte-umami';
	import { stops, manifestReady, loadManifest, findStop } from '$lib/manifest-store';

	export let data: { busStopCode: string };

	let busStop: BusStop | null = null;
	let arrival: BusStopArrival | null = null;
	let errored = false;
	let reloadingData = false;

	$: code = data.busStopCode;
	$: isFav = $favs.includes(code);
	$: if ($manifestReady) {
		const found = findStop($stops, code);
		if (found) busStop = found;
	}

	const loadArrival = async () => {
		try {
			const r = await fetch(`/api/bus-stop-arrival/${code}`);
			const body = await r.json();
			if (!body.ok) {
				errored = true;
				return;
			}
			arrival = body.arrival as BusStopArrival;
			errored = false;
		} catch (err) {
			console.error(err);
			errored = true;
		}
	};

	const refresh = async () => {
		if (reloadingData) return;
		reloadingData = true;
		await loadArrival();
		setTimeout(() => {
			reloadingData = false;
		}, 500);
	};

	let pollId: ReturnType<typeof setInterval> | undefined;

	onMount(() => {
		loadManifest();
		loadArrival();
		pollId = setInterval(() => {
			refresh();
		}, 15000);
	});

	onDestroy(() => {
		if (pollId) clearInterval(pollId);
	});

	const toggleFav = () => {
		const _curFavs = [...$favs];
		if (isFav) {
			favs.set(_curFavs.filter((f) => f !== code));
			trackEvent('unfav', { stop: code });
		} else {
			favs.set([..._curFavs, code]);
			trackEvent('fav', { stop: code });
		}
	};
</script>

<svelte:head>
	<title>{code} | Busket</title>
</svelte:head>
<div id="wrapper">
	{#if errored && arrival === null}
		<div class="flex flex-col items-center py-16 gap-8">
			<h1 class="text-xl font-medium">Error terror 👻</h1>
			<p><a href="/">Try again?</a></p>
		</div>
	{:else}
		<div class="w-full max-w-[600px] mx-auto">
			<div class="px-2 pt-8 pb-2 text-center">
				<h1 class="relative mb-0 text-3xl font-medium">
					<a
						href="#refreshData"
						on:click={(e) => {
							e.preventDefault();
							refresh();
						}}>{code}</a
					>

					<button
						class={`w-2 h-2 absolute left-[calc(50%_-_4rem)] top-[50%] -translate-y-[50%] -translate-x-[50%] rotate-[45deg] ${
							!isFav ? ' border border-gray-600' : 'border-0 bg-pink-400'
						}`}
						on:click={toggleFav}>&nbsp;</button
					>
					{#if reloadingData}
						<b
							class="w-3 h-3 border-2 border-yellow-300 rounded-full absolute left-[calc(50%_+_4rem)] top-[50%] -translate-y-[50%] -translate-x-[50%] pulse-anim"
						></b>
					{:else}
						<button
							on:click={refresh}
							class=" w-3 h-3 border-2 bg-yellow-500 border-yellow-300 rounded-full absolute left-[calc(50%_+_4rem)] top-[50%] -translate-x-[50%] -translate-y-[50%] text-lg"
							>&nbsp;</button
						>
					{/if}
				</h1>
				{#if busStop}
					<h2>{busStop.Description} on {busStop.RoadName}</h2>
				{:else}
					<h2 class="opacity-60"><span class="skeleton-text">Loading stop info…</span></h2>
				{/if}
			</div>
			<div>
				{#if arrival === null}
					<div class="flex flex-col gap-1 max-h-[calc(100vh_-_165px)] overflow-y-scroll pb-8 px-2">
						{#each Array(4) as _, i (i)}
							<div class="p-2 bg-white border border-yellow-200 rounded">
								<div class="grid grid-cols-4 gap-2 items-center">
									<div class="flex items-center gap-2">
										<b class="block w-3 h-3 bg-yellow-100 rounded-full"></b>
										<span class="skeleton-block h-5 w-10"></span>
									</div>
									<span class="skeleton-block h-5 w-12"></span>
									<span class="skeleton-block h-5 w-12"></span>
									<span class="skeleton-block h-5 w-12"></span>
								</div>
							</div>
						{/each}
					</div>
				{:else if arrival.Services.length === 0}
					<p class="flex h-[40vh] items-center text-center justify-center">
						No bus service available at this time.
					</p>
				{:else}
					<div class="flex flex-col gap-1 max-h-[calc(100vh_-_165px)] overflow-y-scroll pb-8 px-2">
						{#each arrival.Services as service (service.ServiceNo)}
							<div class="p-2 bg-white border border-yellow-400 rounded">
								<div class="grid grid-cols-4">
									<div class="flex items-center gap-2">
										<b
											class={`w-3 h-3 block relative rounded-full overflow-hidden -rotate-[45deg] ${
												service.Operator === 'SBST'
													? 'bg-[#891589]'
													: service.Operator === 'SMRT'
														? 'bg-[#E20D25]'
														: 'bg-[#089649]'
											}`}
											><b
												class={`absolute w-full h-[50%] top-[50%] ${
													service.Operator === 'SBST'
														? 'bg-[#D93E25]'
														: service.Operator === 'SMRT'
															? 'bg-[#ccc]'
															: 'bg-green-500'
												}`}>&nbsp;</b
											></b
										>

										<h2 class="text-xl font-medium">{service.ServiceNo}</h2>
									</div>
									<div>
										<NextbusSlot arrival={service.NextBus} />
									</div>
									<div>
										<NextbusSlot arrival={service.NextBus2} />
									</div>
									<div>
										<NextbusSlot arrival={service.NextBus3} />
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style lang="postcss">
	#wrapper {
		@apply flex-grow overflow-hidden relative;
	}

	.pulse-anim {
		animation: pulse infinite ease-in-out 1s;
	}

	@keyframes pulse {
		0% {
			@apply w-3 h-3 opacity-100;
		}

		50% {
			@apply w-6 h-6 opacity-40;
		}

		100% {
			@apply w-3 h-3 opacity-100;
		}
	}

	.skeleton-block {
		@apply inline-block bg-yellow-100 rounded;
		animation: shimmer 1.2s infinite ease-in-out;
	}

	.skeleton-text {
		@apply inline-block bg-yellow-100 rounded px-2;
		animation: shimmer 1.2s infinite ease-in-out;
	}

	@keyframes shimmer {
		0%,
		100% {
			opacity: 0.6;
		}
		50% {
			opacity: 1;
		}
	}
</style>
