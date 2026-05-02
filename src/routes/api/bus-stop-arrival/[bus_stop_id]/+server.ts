import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { BusStopArrival } from '$lib/lta-payload-types';
import { DATAMALL_BUS_ARRIVAL_ENDPOINT } from '$lib/lta-endpoints.js';
import { DATAMALL_API_KEY } from '$env/static/private';

export const GET: RequestHandler = async ({ params, setHeaders }) => {
	try {
		const { bus_stop_id } = params;

		if (!/^[0-9]{5}$/.test(bus_stop_id)) {
			return json({ ok: false }, { status: 400 });
		}

		const reqUrl = new URL(DATAMALL_BUS_ARRIVAL_ENDPOINT);
		reqUrl.searchParams.set('BusStopCode', bus_stop_id);
		const r = await fetch(reqUrl, {
			headers: {
				AccountKey: DATAMALL_API_KEY
			}
		});
		const arrivalData = (await r.json()) as BusStopArrival;

		setHeaders({
			'cache-control': 'public, max-age=15, stale-while-revalidate=45'
		});

		return json({
			ok: true,
			arrival: arrivalData
		});
	} catch (err) {
		console.error(err);
		return json({ ok: false });
	}
};
