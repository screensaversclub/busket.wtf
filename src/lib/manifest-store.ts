import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import type { BusStop } from './lta-payload-types';

const DB_NAME = 'busket';
const DB_VERSION = 1;
const STORE = 'kv';
const KEY = 'stops-manifest';

type CachedManifest = {
	etag: string;
	stops: BusStop[];
	cachedAt: number;
};

function openDb(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, DB_VERSION);
		req.onupgradeneeded = () => {
			const db = req.result;
			if (!db.objectStoreNames.contains(STORE)) {
				db.createObjectStore(STORE);
			}
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}

async function idbGet<T>(key: string): Promise<T | undefined> {
	const db = await openDb();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE, 'readonly');
		const req = tx.objectStore(STORE).get(key);
		req.onsuccess = () => resolve(req.result as T | undefined);
		req.onerror = () => reject(req.error);
	});
}

async function idbPut(key: string, value: unknown): Promise<void> {
	const db = await openDb();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE, 'readwrite');
		tx.objectStore(STORE).put(value, key);
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}

export const stops = writable<BusStop[]>([]);
export const manifestReady = writable(false);

let inflight: Promise<void> | null = null;

export async function loadManifest(force = false): Promise<void> {
	if (!browser) return;
	if (inflight && !force) return inflight;

	inflight = (async () => {
		let cached: CachedManifest | undefined;
		try {
			cached = await idbGet<CachedManifest>(KEY);
			if (cached?.stops?.length) {
				stops.set(cached.stops);
				manifestReady.set(true);
			}
		} catch (err) {
			console.warn('manifest cache read failed', err);
		}

		try {
			const headers: Record<string, string> = {};
			if (cached?.etag) headers['if-none-match'] = cached.etag;

			const r = await fetch('/api/stops-manifest', { headers });
			if (r.status === 304) return;
			if (!r.ok) return;

			const etag = r.headers.get('etag') || '';
			const body = (await r.json()) as { stops: BusStop[] };
			if (!Array.isArray(body.stops)) return;

			const next: CachedManifest = { etag, stops: body.stops, cachedAt: Date.now() };
			stops.set(body.stops);
			manifestReady.set(true);
			await idbPut(KEY, next);
		} catch (err) {
			console.warn('manifest fetch failed', err);
		}
	})();

	try {
		await inflight;
	} finally {
		inflight = null;
	}
}

export function searchStops(all: BusStop[], query: string, limit = 20): BusStop[] {
	const q = query.trim().toLowerCase();
	if (!q) return [];

	const isNumeric = /^[0-9]+$/.test(q);
	const out: BusStop[] = [];
	for (const s of all) {
		if (out.length >= limit) break;
		if (isNumeric) {
			if (s.BusStopCode.includes(q)) out.push(s);
		} else {
			if (
				s.Description.toLowerCase().includes(q) ||
				s.RoadName.toLowerCase().includes(q)
			) {
				out.push(s);
			}
		}
	}
	return out;
}

const EARTH_RADIUS_M = 6371000;
const toRad = (d: number) => (d * Math.PI) / 180;

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
	const dLat = toRad(lat2 - lat1);
	const dLon = toRad(lon2 - lon1);
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
	return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

export function nearbyStops(
	all: BusStop[],
	lat: number,
	lon: number,
	limit = 10
): (BusStop & { distance: number })[] {
	const latDelta = 0.02;
	const lonDelta = 0.02 / Math.cos(toRad(lat) || 1);
	const results: (BusStop & { distance: number })[] = [];

	for (const s of all) {
		if (Math.abs(s.Latitude - lat) > latDelta) continue;
		if (Math.abs(s.Longitude - lon) > lonDelta) continue;
		results.push({ ...s, distance: haversine(lat, lon, s.Latitude, s.Longitude) });
	}
	results.sort((a, b) => a.distance - b.distance);
	return results.slice(0, limit);
}

export function findStop(all: BusStop[], code: string): BusStop | undefined {
	return all.find((s) => s.BusStopCode === code);
}
