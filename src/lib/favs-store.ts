import { browser } from '$app/environment';
import { writable } from 'svelte/store';

const favsStore = !browser ? '' : localStorage.getItem('busket-favs');
export const favs = writable(favsStore !== null ? favsStore.split(';') : []);
favs.subscribe((v) => {
	if (browser) {
		localStorage.setItem('busket-favs', v.join(';'));
	}
});
