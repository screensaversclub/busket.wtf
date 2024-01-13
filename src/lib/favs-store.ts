import { browser } from '$app/environment';
import { writable } from 'svelte/store';

const favsStore = !browser ? '' : localStorage.getItem('busket-favs');
export const favs = writable(
	favsStore !== null ? favsStore.split(';').filter((a) => a.length > 0) : []
);
favs.subscribe((v) => {
	if (browser) {
		localStorage.setItem('busket-favs', v.filter((a) => a.length > 0).join(';'));
	}
});
