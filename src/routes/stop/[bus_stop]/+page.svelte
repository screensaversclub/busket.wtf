<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { BusStop, BusStopArrival } from '$lib/lta-payload-types';
	import NextbusSlot from './nextbus_slot.svelte';
	import { UmamiAnalytics } from '@lukulent/svelte-umami';
	import { favs } from '$lib/favs-store';

	let reloadingData = false;
	export let data:
		| {
				ok: false;
		  }
		| {
				ok: true;
				busStop: BusStop;
				arrival: BusStopArrival;
		  };

	$: isFav = data.ok === false ? false : $favs.includes(data.busStop.BusStopCode);

	setInterval(() => {
		if (reloadingData === false) {
			reloadingData = true;
			invalidateAll().finally(() => {
				setTimeout(() => {
					reloadingData = false;
				}, 500);
			});
		}
	}, 15000);
</script>

<svelte:head>
	<title>{data.ok ? data.busStop.BusStopCode : 'Error'} | Busket</title>
</svelte:head>
<div id="wrapper">
	{#if data.ok}
		<div class="w-full max-w-[600px] mx-auto">
			<div class="px-2 pt-8 pb-2 text-center">
				<h1 class="relative mb-0 text-3xl font-medium">
					<a
						href="#refreshData"
						on:click={async (e) => {
							e.preventDefault();
							reloadingData = true;
							await invalidateAll();
							setTimeout(() => {
								reloadingData = false;
							}, 500);
						}}>{data.busStop.BusStopCode}</a
					>

					<button
						class={`w-2 h-2 absolute left-[calc(50%_-_4rem)] top-[50%] -translate-y-[50%] -translate-x-[50%] rotate-[45deg] ${
							!isFav ? ' border border-gray-600' : 'border-0 bg-pink-400'
						}`}
						on:click={() => {
							if (data.ok === false) {
								return;
							}

							const _curFavs = [...$favs];

							if (isFav) {
								favs.set(
									_curFavs.filter((f) => {
										if (data.ok === false) {
											return false;
										}
										return f !== data.busStop.BusStopCode;
									})
								);
							} else {
								favs.set([..._curFavs, data.busStop.BusStopCode]);
							}
						}}>&nbsp;</button
					>
					{#if reloadingData}
						<b
							class="w-3 h-3 border-2 border-yellow-300 rounded-full absolute left-[calc(50%_+_4rem)] top-[50%] -translate-y-[50%] -translate-x-[50%] pulse-anim"
						></b>
					{:else}
						<button
							on:click={async () => {
								reloadingData = true;
								await invalidateAll();
								setTimeout(() => {
									reloadingData = false;
								}, 500);
							}}
							class=" w-3 h-3 border-2 bg-yellow-500 border-yellow-300 rounded-full absolute left-[calc(50%_+_4rem)] top-[50%] -translate-x-[50%] -translate-y-[50%] text-lg"
							>&nbsp;</button
						>
					{/if}
				</h1>
				<h2>{data.busStop.Description} on {data.busStop.RoadName}</h2>
			</div>
			<div>
				{#if data.arrival.Services.length === 0}
					<p class="flex h-[40vh] items-center text-center justify-center">
						No bus service available at this time.
					</p>
				{:else}
					<div class="flex flex-col gap-1 max-h-[calc(100vh_-_165px)] overflow-y-scroll pb-8 px-2">
						{#each data.arrival.Services as service (service.ServiceNo)}
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
	{:else}
		<div class="flex flex-col items-center py-16 gap-8">
			<h1 class="text-xl font-medium">Error terror 👻</h1>
			<p><a href="/">Try again?</a></p>
		</div>
	{/if}

	<UmamiAnalytics
		websiteID="b009e657-7f2d-4e57-be06-caeaca951e86"
		srcURL="https://umami-production-6250.up.railway.app/script.js"
		configuration={{ 'data-auto-track': false }}
	/>
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
</style>
