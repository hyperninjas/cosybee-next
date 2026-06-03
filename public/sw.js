/*
 * EnergieBee service worker.
 *
 * Hand-written (no Workbox/Serwist) because the project runs on Turbopack,
 * and the Serwist plugin still requires a webpack config. The strategies
 * below cover what a marketing site actually benefits from:
 *
 *   - Instant repeat loads: content-hashed build assets are cached forever
 *     (cache-first); CSS/JS/fonts use stale-while-revalidate.
 *   - Resilient images: served from cache, refreshed in the background, capped.
 *   - Offline navigation: pages are network-first with a cached copy as the
 *     fallback, and a branded /offline page when nothing is cached.
 *
 * Bump CACHE_VERSION whenever this file's caching logic changes — the old
 * caches are purged on activate. (Hashed asset URLs already bust themselves,
 * so a bump is only needed for strategy changes, not normal deploys.)
 */

const CACHE_VERSION = "v3";
const PRECACHE = `eb-precache-${CACHE_VERSION}`;
const PAGE_CACHE = `eb-pages-${CACHE_VERSION}`;
const ASSET_CACHE = `eb-assets-${CACHE_VERSION}`;
const IMAGE_CACHE = `eb-images-${CACHE_VERSION}`;
const CURRENT_CACHES = new Set([
  PRECACHE,
  PAGE_CACHE,
  ASSET_CACHE,
  IMAGE_CACHE,
]);

const OFFLINE_URL = "/offline";
// Keep the precache list tiny so install never fails on a flaky asset.
const PRECACHE_URLS = [OFFLINE_URL];

// Soft caps so a long browsing session can't grow the caches unbounded.
const MAX_PAGES = 50;
const MAX_IMAGES = 80;
const MAX_ASSETS = 120;

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Drop caches from older versions of this worker.
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("eb-") && !CURRENT_CACHES.has(key))
          .map((key) => caches.delete(key)),
      );

      // Navigation preload lets the browser start the network request for a
      // page in parallel with the worker boot, removing the SW startup cost
      // from the critical path of the first navigation.
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }

      await self.clients.claim();
    })(),
  );
});

// Allow the page to trigger an immediate activation of a waiting worker.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

// ---------------------------------------------------------------------------
// Fetch routing
// ---------------------------------------------------------------------------

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only GET is cacheable. Server Actions (POST), uploads, etc. pass through.
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Ignore non-http(s) schemes (chrome-extension:, data:, etc.).
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  const sameOrigin = url.origin === self.location.origin;

  // Never cache React Server Component payloads — they vary by a header the
  // Cache API can't key on, so a cached RSC could be served for the wrong
  // request. Let them hit the network untouched.
  if (request.headers.get("RSC") === "1" || url.searchParams.has("_rsc")) {
    return;
  }

  // Admin panel and API routes are dynamic/private — always network, no cache.
  if (
    sameOrigin &&
    (url.pathname.startsWith("/admin") || url.pathname.startsWith("/api/"))
  ) {
    return;
  }

  // HTML page loads: network-first, fall back to cache, then to /offline.
  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(event));
    return;
  }

  // Immutable, content-hashed build output: cache-first forever.
  if (sameOrigin && url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

  // Images (local /public + the remote media host): stale-while-revalidate.
  if (request.destination === "image") {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE, MAX_IMAGES));
    return;
  }

  // Same-origin CSS / JS / fonts: stale-while-revalidate.
  if (
    sameOrigin &&
    (request.destination === "style" ||
      request.destination === "script" ||
      request.destination === "font")
  ) {
    event.respondWith(staleWhileRevalidate(request, ASSET_CACHE, MAX_ASSETS));
    return;
  }

  // Everything else: default browser behaviour (network).
});

// ---------------------------------------------------------------------------
// Strategies
// ---------------------------------------------------------------------------

async function networkFirstPage(event) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    // Use the preloaded response if navigation preload kicked in.
    const preloaded = await event.preloadResponse;
    const response = preloaded || (await fetch(event.request));

    // Only store complete, same-origin HTML documents.
    if (response && response.ok && response.type === "basic") {
      cache.put(event.request, response.clone());
      trimCache(PAGE_CACHE, MAX_PAGES);
    }
    return response;
  } catch {
    const cached = await cache.match(event.request);
    if (cached) return cached;
    const offline = await caches.match(OFFLINE_URL);
    return (
      offline ||
      new Response("You are offline.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    );
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && (response.ok || response.type === "opaque")) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return cached || Response.error();
  }
}

async function staleWhileRevalidate(request, cacheName, max) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const network = fetch(request)
    .then((response) => {
      if (response && (response.ok || response.type === "opaque")) {
        cache.put(request, response.clone());
        if (max) trimCache(cacheName, max);
      }
      return response;
    })
    .catch(() => cached);

  // Serve cache immediately when present; revalidate happens in the background.
  return cached || network;
}

// Simple FIFO eviction to keep a runtime cache under `max` entries.
async function trimCache(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  const overflow = keys.length - max;
  for (let i = 0; i < overflow; i++) {
    await cache.delete(keys[i]);
  }
}
