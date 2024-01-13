<script lang="ts">
	import type { BusStopArrival } from '$lib/lta-payload-types';
	import { intervalToDuration } from 'date-fns';

	export let arrival: BusStopArrival['Services'][number]['NextBus'];

	$: arrivalDuration =
		arrival === undefined || arrival.EstimatedArrival === ''
			? '-'
			: intervalToDuration({
					start: new Date(),
					end: new Date(arrival.EstimatedArrival)
				});
</script>

<div class="flex items-center gap-1">
	{#if arrival !== undefined}
		<h4 class="w-8 text-lg text-center">
			{typeof arrivalDuration === 'string'
				? '-'
				: Math.max(0, arrivalDuration.minutes || 0) === 0
					? 'Arr'
					: Math.max(0, arrivalDuration.minutes || 0)}<br />
		</h4>

		{#if arrivalDuration !== '-'}
			<div
				class={`w-6 h-6 [&_path]:stroke-[4px] ${
					arrival.Load === 'SEA'
						? '[&_path]:stroke-green-400'
						: arrival.Load === 'SDA'
							? '[&_path]:stroke-orange-400'
							: '[&_path]:stroke-red-400'
				}
			`}
			>
				{#if arrival.Type === 'SD'}
					<svg viewBox="0 0 75 75" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path
							d="M9 31H66V53H55.9725C55.7238 55.25 53.8163 57 51.5 57C49.1837 57 47.2762 55.25 47.0275 53H28.9725C28.7238 55.25 26.8163 57 24.5 57C22.1837 57 20.2762 55.25 20.0275 53H9V31Z"
						/>
					</svg>
				{:else if arrival.Type === 'DD'}
					<svg viewBox="0 0 75 75" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path
							d="M15 17H60V53H53.9725C53.7238 55.25 51.8163 57 49.5 57C47.1837 57 45.2762 55.25 45.0275 53H29.9725C29.7238 55.25 27.8163 57 25.5 57C23.1837 57 21.2762 55.25 21.0275 53H15V17Z"
						/>
					</svg>
				{:else}
					<svg viewBox="0 0 75 75" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path
							d="M0 31H40V53H35.9725C35.7238 55.25 33.8163 57 31.5 57C29.1837 57 27.2762 55.25 27.0275 53H13.9725C13.7238 55.25 11.8163 57 9.5 57C7.18373 57 5.27618 55.25 5.02747 53H0V31Z"
						/>
						<path
							d="M43 31H75V53H64.9725C64.7238 55.25 62.8163 57 60.5 57C58.1837 57 56.2762 55.25 56.0275 53H43V31Z"
						/>
					</svg>
				{/if}
			</div>{/if}
	{/if}
</div>
