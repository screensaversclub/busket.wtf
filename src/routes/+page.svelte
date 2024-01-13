<script lang="ts">
	import type { BusStop } from '$lib/lta-payload-types';
	import { favs } from '$lib/favs-store';
	import { browser } from '$app/environment';

	let buscode_input = '';
	let searching = false;
	let search_results: BusStop[] = [];

	let search_timeout_id: ReturnType<typeof setTimeout>;

	let favBusStops: BusStop[] = [];

	const fetchFavBusStops = async () => {
		const fetchPromises = $favs.map((code) => {
			return (async () => {
				const r = await fetch(`/api/bus-stop/${code}`);
				const data = await r.json();
				return data;
			})();
		});
		favBusStops = (await Promise.all(fetchPromises))
			.map((res) => (res.ok === true ? res.busStop : null))
			.filter((a) => a !== null) as BusStop[];
	};

	if (browser) {
		setTimeout(() => {
			fetchFavBusStops();
		}, 1000);
	}

	const search = async () => {
		if (!/^[0-9]{2,5}$/.test(buscode_input)) {
			searching = false;
			search_results = [];
			return;
		}
		try {
			const _r = await fetch(`/api/bus-stop-search/${buscode_input}`);
			const data = await _r.json();
			search_results = data.data;
			searching = false;
		} catch (err) {
			console.error(err);
			search_results = [];
			searching = false;
		}
	};

	const debounced_search = () => {
		if (typeof search_timeout_id === 'number') {
			clearTimeout(search_timeout_id);
		}

		search_timeout_id = setTimeout(() => {
			search();
		}, 500);
	};

	const findNearbyStops = () => {
		searching = true;
		buscode_input = '';
		if (!navigator.geolocation) {
			alert('Oops, geolocation not available');
			searching = false;
		} else {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					fetch(`/api/bus-stop-near`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application-json'
						},
						body: JSON.stringify({
							lat: position.coords.latitude,
							long: position.coords.longitude
						})
					})
						.then((r) => {
							r.json().then((value) => {
								search_results = [...value.data];
								searching = false;
							});
						})
						.catch((err) => {
							console.error(err);
							alert('There was an error locating you');
							searching = false;
						});
				},
				(err) => {
					console.error(err);
					alert('There was an error locating you');
					searching = false;
				}
			);
		}
	};
</script>

<svelte:head>
	<title>Busket</title>
</svelte:head>

<div id="wrapper">
	<div id="interface">
		<label for="buscode_input">Enter bus stop code:</label>
		<div class="flex items-center gap-2">
			<input
				type="number"
				pattern="[0-9]*"
				id="buscode_input"
				placeholder="12129"
				bind:value={buscode_input}
				on:input={() => {
					searching = true;
					debounced_search();
				}}
			/>
			<button
				class="absolute text-2xl right-2"
				on:click={() => {
					findNearbyStops();
				}}>📍</button
			>
		</div>
		{#if buscode_input !== '' || search_results.length !== 0 || searching}
			<div class="results_wrapper show">
				{#if searching === true}
					<p class="py-2 text-center">
						<span>I'm looking...</span>
					</p>
				{:else if search_results.length === 0}
					<p class="py-2 text-center">
						<span>No results</span>
					</p>
				{:else}
					<ul>
						{#each search_results as result (result.BusStopCode)}
							<li>
								<a href={`/stop/${result.BusStopCode}`}
									><h4>{result.Description}<b>{result.BusStopCode}</b></h4>
									<p>{result.RoadName}</p></a
								>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{:else if favBusStops.length > 0}
			<div class="fav_stops">
				<h2>Favourites</h2>
				<ul>
					{#each favBusStops as stop (stop.BusStopCode)}
						<li>
							<a href={`/stop/${stop.BusStopCode}`}
								><h4>{stop.Description}<b>{stop.BusStopCode}</b></h4>
								<p>{stop.RoadName}</p></a
							>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
</div>

<style lang="postcss">
	#wrapper {
		@apply flex-grow overflow-hidden relative;
	}

	#interface {
		@apply top-[15%] left-[50%] -translate-x-[50%] -translate-y-[50%] absolute flex flex-col gap-2 items-center text-xl;

		input {
			@apply text-3xl border border-yellow-500 w-[8em] rounded text-center p-2;
		}
	}

	.results_wrapper {
		@apply absolute top-[calc(100%_+_5px)] left-[50%] max-w-[90vw] w-[600px] -translate-x-[50%] border border-yellow-500 rounded hidden bg-white shadow max-h-[50vh] overflow-y-scroll;
	}

	.results_wrapper.show {
		@apply block;
	}

	.fav_stops {
		@apply absolute top-[calc(100%_+_5px)] left-[50%] max-w-[90vw] w-[600px] -translate-x-[50%] border border-yellow-500 rounded bg-white shadow max-h-[50vh] overflow-y-scroll;

		h2 {
			@apply text-sm text-center uppercase bg-yellow-500 text-yellow-800;
		}
	}

	.results_wrapper ul,
	.fav_stops ul {
		@apply block;

		li {
			a {
				@apply bg-[transparent] block w-full py-1 border-b px-2;

				&:hover,
				&:active {
					@apply bg-yellow-100;
				}

				h4 {
					@apply text-lg font-medium flex justify-start items-center;
				}
				b {
					@apply text-xs font-normal ml-3 bg-yellow-600 block py-1 px-2 text-white rounded;
				}
				p {
					@apply text-sm;
				}
			}

			&:last-child {
				a {
					@apply border-b-0;
				}
			}
		}
	}
</style>
