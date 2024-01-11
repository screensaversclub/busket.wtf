<script lang="ts">
	import type { BusStop } from '$lib/lta-payload-types';

	let buscode_input = '';
	let searching = false;
	let search_results: BusStop[] = [];

	let search_timeout_id: ReturnType<typeof setTimeout>;

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
				type="text"
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
		<div
			class={`results_wrapper ${
				buscode_input !== '' || search_results.length !== 0 || searching ? 'show' : ''
			}`}
		>
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
	</div>
</div>

<style lang="postcss">
	#wrapper {
		@apply border flex-grow overflow-hidden relative;
	}

	#interface {
		@apply top-[15%] left-[50%] -translate-x-[50%] -translate-y-[50%] absolute flex flex-col gap-2 items-center text-xl;

		input {
			@apply text-3xl border border-yellow-500 w-[8em] rounded text-center p-2;
		}
	}

	.results_wrapper {
		@apply absolute top-[calc(100%_+_5px)] left-[50%] max-w-[90vw] w-[600px] -translate-x-[50%] border border-yellow-500 rounded hidden bg-white shadow max-h-[50vh] overflow-y-scroll;

		ul {
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
	}

	.results_wrapper.show {
		@apply block;
	}
</style>
