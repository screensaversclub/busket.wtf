import { json } from '@sveltejs/kit';
import { DATAMALL_BUS_STOPS_ENDPOINT } from '$lib/lta-endpoints.js';
import { DATAMALL_API_KEY } from '$env/static/private';
import type { BusStop } from '$lib/lta-payload-types';
import { redis } from '$lib/redis';

const getBusStopData: (skip?: number, accum?: BusStop[]) => Promise<BusStop[]> = async (
	skip = 0,
	accum = []
) => {
	const reqUrl = new URL(DATAMALL_BUS_STOPS_ENDPOINT);
	reqUrl.searchParams.set('$skip', skip.toString());

	const r = await fetch(reqUrl, {
		headers: {
			AccountKey: DATAMALL_API_KEY
		}
	});

	const busStopsData = (await r.json()) as {
		'odata.metadata': string;
		value: BusStop[];
	};

	if (busStopsData.value.length > 0) {
		return getBusStopData(skip + 500, [...accum, ...busStopsData.value]);
	} else {
		return accum;
	}
};

export async function GET(req) {
	const authHeader = req.request.headers.get('authorization');
	if (
		process.env.NODE_ENV === 'production' &&
		(!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`)
	) {
		return json({ ok: false });
	}

	try {
		const d = await getBusStopData();
		const now = new Date();

		d.forEach((stop) => {
			redis.hset(`STOP_${stop.BusStopCode}`, stop);
			redis.zrem('busstop_geos', stop.BusStopCode);
			redis.geoadd('busstop_geos', stop.Longitude, stop.Latitude, stop.BusStopCode);
		});

		redis.set('BUSSTOP-LAST-UPDATED', now.getTime());

		return json({ ok: true });
	} catch (err) {
		console.warn(err);
		return json({ ok: false, err });
	}
}
