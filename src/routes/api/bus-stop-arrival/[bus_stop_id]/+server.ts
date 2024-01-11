import { json } from '@sveltejs/kit';
import type { BusStop, BusStopArrival } from '$lib/lta-payload-types';
import { redis } from '$lib/redis.js';
import { DATAMALL_BUS_ARRIVAL_ENDPOINT } from '$lib/lta-endpoints.js';
import { DATAMALL_API_KEY } from '$env/static/private';

export async function GET({ params }) {
	try {
		const { bus_stop_id } = params;

		const busStopRecord = await redis.hgetall(`STOP_${bus_stop_id}`);

		if (Object.keys(busStopRecord).length === 0) {
			return json({ ok: false });
		}

		const busStop: BusStop = {
			BusStopCode: busStopRecord.BusStopCode,
			Description: busStopRecord.Description,
			RoadName: busStopRecord.RoadName,
			Latitude: parseFloat(busStopRecord.Latitude),
			Longitude: parseFloat(busStopRecord.Longitude)
		};

		const reqUrl = new URL(DATAMALL_BUS_ARRIVAL_ENDPOINT);
		reqUrl.searchParams.set('BusStopCode', bus_stop_id);
		const r = await fetch(reqUrl, {
			headers: {
				AccountKey: DATAMALL_API_KEY
			}
		});
		const arrivalData = (await r.json()) as BusStopArrival;

		return json({
			ok: true,
			busStop,
			arrival: arrivalData
		});
	} catch (err) {
		console.error(err);
		return json({ ok: false });
	}
}
