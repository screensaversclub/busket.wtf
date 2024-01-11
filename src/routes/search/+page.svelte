<script lang="ts">
	let signal: string = '';

	const handleChange = (e: Event) => {
		signal = (e.currentTarget as HTMLInputElement).value;
	};

	$: results = signal.split('');
</script>

<div>
	<form>
		<label for="code">Enter bus stop code</label>
		<input type="text" id="code" on:input={handleChange} />
		{#each results as char}
			&rarr; {char}<br />
		{/each}
	</form>
</div>

<style lang="postcss">
	input {
		@apply border;
	}
</style>
