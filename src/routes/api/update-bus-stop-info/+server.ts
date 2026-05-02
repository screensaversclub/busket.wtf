import { json } from '@sveltejs/kit';
import { createHash } from 'node:crypto';
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

export async function GET({ request }: { request: Request }) {
	const authHeader = request.headers.get('authorization');
	if (
		process.env.NODE_ENV === 'production' &&
		(!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`)
	) {
		return json({ ok: false });
	}

	try {
		const stops = await getBusStopData();
		const now = new Date();

		const pipeline = redis.pipeline();
		stops.forEach((stop) => {
			pipeline.hset(`STOP_${stop.BusStopCode}`, stop);
			pipeline.zrem('busstop_geos', stop.BusStopCode);
			pipeline.geoadd('busstop_geos', stop.Longitude, stop.Latitude, stop.BusStopCode);
		});
		await pipeline.exec();

		const sorted = [...stops].sort((a, b) => a.BusStopCode.localeCompare(b.BusStopCode));
		const manifestJson = JSON.stringify({ stops: sorted });
		const etag = `"${createHash('sha1').update(manifestJson).digest('hex')}"`;

		await redis
			.pipeline()
			.set('STOPS_MANIFEST_JSON', manifestJson)
			.set('STOPS_MANIFEST_ETAG', etag)
			.set('BUSSTOP-LAST-UPDATED', now.getTime())
			.exec();

		return json({ ok: true, count: stops.length, etag });
	} catch (err) {
		console.warn(err);
		return json({ ok: false, err });
	}
}
