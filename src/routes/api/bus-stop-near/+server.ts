import { json } from '@sveltejs/kit';
import { redis } from '$lib/redis.js';

export async function POST({ request }) {
	const { long, lat } = await request.json();

	try {
		if (typeof long !== 'number' || typeof lat !== 'number') {
			return json({ ok: false, data: [] });
		}

		const busStopCodesByDist = (await redis.georadius(
			'busstop_geos',
			long,
			lat,
			'200',
			'km',
			'WITHDIST',
			'COUNT',
			'10'
		)) as string[][];

		const busStops = (
			await Promise.all(
				busStopCodesByDist
					.filter((_, n) => n <= 10)
					.map((code) => {
						return redis.hgetall(`STOP_${code[0]}`);
					})
			)
		)
			.map((stop, n) => {
				return { ...stop, distance: parseFloat(busStopCodesByDist[n][1]) };
			})
			.sort((a, b) => a.distance - b.distance);

		return json({
			ok: true,
			data: busStops
		});
	} catch (err) {
		console.error(err);
		return json({ ok: false, data: [] });
	}
}
