# v2.0 plan 

1. Ship the stop manifest to the browser, not the network

Same logic as iOS: 5,600 stops × ~80 bytes ≈ ~450 KB raw, ~80–120 KB gzipped. One-time download, then served from the cache forever (until the `etag` changes).

- Store in **IndexedDB** (or a single Cache Storage entry as JSON).
- Search becomes a synchronous in-memory filter — **0 ms**, no network at all. Type "bedok" and results appear as fast as you can render them.
- `/api/bus-stop-near` becomes a client-side computation: get geolocation, run a bounding-box filter + Haversine sort over the in-memory list. ~1 ms for 5,600 stops.
- Backend keeps one new endpoint: `GET /api/stops-manifest` returning `{etag, stops: [...]}` with `Cache-Control: public, max-age=21600` (6h, matches your cron). Conditional `If-None-Match` returns 304 → ~5 KB response.

This deletes 3 of your 5 routes from the user's hot path entirely.

## 2. Service Worker with stale-while-revalidate

For the one route that *must* go to network (`/api/bus-stop-arrival`):

- **Stale-while-revalidate**: SW returns the last cached arrival immediately (even if 30s old) and refetches in the background. User sees data in <50 ms instead of 300–800 ms.
- Show a subtle "updating…" indicator so users know it's refreshing.
- Cache TTL ~20s — arrivals change minute-by-minute, but stale-by-20s is much better than blank-for-500ms.

Workbox or a hand-rolled SW both fine. SvelteKit has good SW integration.

## 3. Get the arrival request closer to DataMall

DataMall is in Singapore. Make sure your Vercel function is too:

- In `vercel.json` (or `vercel.ts`): `"regions": ["sin1"]`. If it's defaulting to `iad1` you're paying 200+ ms of trans-Pacific RTT for nothing.
- Fluid Compute already keeps instances warm across requests, so subsequent arrival fetches reuse the connection to DataMall — keep an `undici` Agent with `keepAlive` if you're not already, so TLS isn't renegotiated each call.

## 4. Preload aggressively on intent

- On the home page, when a user *hovers/touches* a favourite stop, kick off the arrival fetch immediately (`<link rel="prefetch">` or a manual `fetch()`). By the time they tap, response is in cache.
- Use SvelteKit's `data-sveltekit-preload-data="hover"` (or `tap` on mobile) on stop links.
- For the "nearby" view, prefetch geolocation on page load if permission already granted.

## 5. Bundle & render path

PWAs live and die by the first paint. Quick wins:

- **Precompute the home page** — it's static shell + client-fetched data. SvelteKit `prerender = true` on `+page.ts`, ship as HTML from the edge.
- **Inline critical CSS**, defer the rest.
- **Avoid client hydration for static parts** — Svelte 5 makes this easy with `<svelte:options runes={true} />` and only marking interactive components as client.
- **Self-host fonts** with `font-display: swap` and preload the one weight you actually use above the fold.

## 6. Skeleton UI, not spinners

The arrival fetch is the only slow thing left. Render the stop's metadata (you have it locally!) immediately, and show skeleton rows where the arrival times will appear. Perceived performance > actual performance — a 600 ms wait with the stop name and skeleton looks faster than a 300 ms wait on a blank screen.

## 7. Optimistic geolocation

`navigator.geolocation.getCurrentPosition` can take 1–5 seconds on first call. Two tricks:

- Request permission earlier than you need it (e.g., on app shell load if user previously granted).
- Use `watchPosition` with a cached last-known position so you can render nearby stops *immediately* with stale coords, then refine.

## 8. What about Redis vs Postgres here?

Less relevant than ever. With the manifest-on-device approach:

- 4 of 5 routes don't hit your backend at all → DB choice is moot.
- The one route that does (`bus-stop-arrival`) is bottlenecked by DataMall, not your DB.

Storage choice becomes a backend-ergonomics question, not a UX question.

## Concrete order I'd do this in

1. **Move function to `sin1` region** if it's not already (10 min, biggest single win if currently mislocated).
2. **Ship the stop manifest endpoint + IndexedDB cache** (1 day, makes search instant and enables offline).
3. **Service worker with SWR for arrivals** (half day, makes repeat views feel instant).
4. **Skeleton UI for first arrival load** (1 hr, perceived perf).
5. **Prefetch on hover/tap** (1 hr, eliminates the wait for power users).
