<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { BusStop, BusStopArrival } from '$lib/lta-payload-types';
	import NextbusSlot from './nextbus_slot.svelte';

	export let data:
		| {
				ok: false;
		  }
		| {
				ok: true;
				busStop: BusStop;
				arrival: BusStopArrival;
		  };
</script>

<svelte:head>
	<title>{data.ok ? data.busStop.BusStopCode : 'Error'} | Busket</title>
</svelte:head>
<div id="wrapper">
	{#if data.ok}
		<div class="w-full max-w-[600px] mx-auto">
			<div class="px-2 pt-8 pb-2 text-center">
				<h1 class="relative mb-0 text-3xl font-medium">
					{data.busStop.BusStopCode}<button
						on:click={() => {
							invalidateAll();
						}}
						class="absolute right-4 top-[50%] -translate-y-[50%] text-lg">🔄</button
					>
				</h1>
				<h2>{data.busStop.Description} on {data.busStop.RoadName}</h2>
			</div>
			<div>
				{#if data.arrival.Services.length === 0}
					<p class="flex h-[40vh] items-center text-center justify-center">
						No bus service available at this time.
					</p>
				{:else}
					<div class="flex flex-col gap-1 max-h-[calc(100vh_-_165px)] overflow-y-scroll pb-8">
						{#each data.arrival.Services as service (service.ServiceNo)}
							<div class="p-2 bg-white border border-yellow-400 rounded">
								<div class="grid grid-cols-4">
									<div class="flex items-center gap-2">
										<b
											class={`w-3 h-3 block rounded-full ${
												service.Operator === 'SBST'
													? 'bg-purple-500'
													: service.Operator === 'SMRT'
														? 'bg-red-500'
														: 'bg-green-500'
											}`}
										/>

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
		</div>{:else}
		<div class="flex flex-col items-center py-16 gap-8">
			<h1 class="text-xl font-medium">Error terror 👻</h1>
			<p><a href="/">Try again?</a></p>
		</div>
	{/if}
</div>

<style lang="postcss">
	#wrapper {
		@apply flex-grow overflow-hidden relative;
	}
</style>
