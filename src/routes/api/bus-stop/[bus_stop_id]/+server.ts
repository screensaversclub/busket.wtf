import { json } from '@sveltejs/kit';
import type { BusStop } from '$lib/lta-payload-types';
import { redis } from '$lib/redis.js';
import invariant from 'tiny-invariant';

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

		invariant(typeof busStop.BusStopCode === 'string', 'Wrong data type bsc');
		invariant(typeof busStop.Description === 'string', 'Wrong data type desc');
		invariant(typeof busStop.RoadName === 'string', 'Wrong data type road');
		invariant(typeof busStop.Latitude === 'number', 'Wrong data type lat');
		invariant(typeof busStop.Longitude === 'number', 'Wrong data type lon');

		return json({
			ok: true,
			busStop
		});
	} catch (err) {
		console.error(err);
		return json({ ok: false });
	}
}
