import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, url }) => {
	const _url = new URL(url);
	try {
		const r = await fetch(`${_url.protocol}//${_url.host}/api/bus-stop-arrival/${params.bus_stop}`);
		const data = await r.json();
		return data;
	} catch (err) {
		console.error(err);
		return { ok: false };
	}
};
