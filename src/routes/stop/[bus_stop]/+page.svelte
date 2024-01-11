<script lang="ts">
	import type { BusStop, BusStopArrival } from '$lib/lta-payload-types';

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
		<div class="w-full max-w-[600px] mx-auto p-4">
			<div class="pt-8 pb-2 border-b border-b-yellow-500">
				<h1 class="text-3xl font-medium">{data.busStop.BusStopCode}</h1>
				<h2>{data.busStop.Description} on {data.busStop.RoadName}</h2>
			</div>
			<div>
				{#if data.arrival.Services.length === 0}
					<p class="flex h-[40vh] items-center text-center justify-center">
						No service available at this time.
					</p>
				{:else}
					{#each data.arrival.Services as service (service)}
						<div>
							<h2>{service.ServiceNo}</h2>
						</div>
					{/each}
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
		@apply border flex-grow overflow-hidden relative;
	}
</style>
