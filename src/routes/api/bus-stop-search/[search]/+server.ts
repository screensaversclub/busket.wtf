import { json } from '@sveltejs/kit';
import { redis } from '$lib/redis.js';

const findKey: (
	search: string,
	numResults: number,
	accum?: string[],
	cursor?: number
) => Promise<string[]> = async (search, numResults, accum, cursor) => {
	const _accum = accum || [];

	if (_accum.length >= numResults) {
		return [..._accum];
	}

	const [nextCursor, busStopCodes] = await redis.scan(
		cursor || 0,
		'MATCH',
		`*${search}*`,
		'COUNT',
		1000
	);

	if (nextCursor === '0') {
		//reached the end, first iteration = cursor :undefined
		return [..._accum, ...busStopCodes]; // end iteration
	}

	return findKey(search, numResults, [..._accum, ...busStopCodes], parseInt(nextCursor));
};

export async function GET({ params }) {
	try {
		const { search } = params;

		if (!/^[0-9]{2,5}$/.test(search)) {
			return json({ ok: true, data: [] });
		}

		if (search.length === 5) {
			//short circuit this if exactly bus code length
			const busStop = await redis.hgetall(`STOP_${search}`);

			return json({
				ok: true,
				data: busStop.BusStopCode === undefined ? [] : [busStop]
			});
		}

		const busStopCodes = await findKey(`STOP_*${search}*`, 10);

		const busStops = await Promise.all(
			busStopCodes
				.filter((_, n) => n <= 10)
				.map((code) => {
					return redis.hgetall(code);
				})
		);

		return json({
			ok: true,
			data: busStops
		});
	} catch (err) {
		console.error(err);
		return json({ ok: false, data: [] });
	}
}
