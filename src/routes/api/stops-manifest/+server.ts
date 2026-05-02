import { redis } from '$lib/redis';

export async function GET({ request }: { request: Request }) {
	const [etag, manifestJson] = await Promise.all([
		redis.get('STOPS_MANIFEST_ETAG'),
		redis.get('STOPS_MANIFEST_JSON')
	]);

	if (!etag || !manifestJson) {
		return new Response(JSON.stringify({ ok: false, error: 'manifest not ready' }), {
			status: 503,
			headers: {
				'content-type': 'application/json',
				'cache-control': 'no-store'
			}
		});
	}

	const ifNoneMatch = request.headers.get('if-none-match');
	if (ifNoneMatch && ifNoneMatch === etag) {
		return new Response(null, {
			status: 304,
			headers: {
				etag,
				'cache-control': 'public, max-age=21600, stale-while-revalidate=86400'
			}
		});
	}

	return new Response(manifestJson, {
		status: 200,
		headers: {
			'content-type': 'application/json',
			etag,
			'cache-control': 'public, max-age=21600, stale-while-revalidate=86400'
		}
	});
}
