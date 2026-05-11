/**
 * JobTrack service worker (Phase 9).
 *
 * Strategy:
 *   - install:   cache the app shell (HTML + manifest + icons)
 *   - activate:  prune stale caches from previous deployments
 *   - fetch:
 *       - /api/* and /v3/api-docs/* → network-only (no stale data)
 *       - hashed static assets (.js/.css/.woff2/.svg/.png) →
 *         cache-first, fall back to network and cache on success
 *       - everything else (navigation requests) → network-first with
 *         the app shell as offline fallback
 *
 * Filenames produced by `nx build crm --configuration=production` are
 * content-hashed (e.g. main-72GLOWNV.js), so cache invalidation is
 * automatic — new deploys produce new URLs that miss the cache.
 */

const VERSION = 'jobtrack-v1';
const SHELL = ['/', '/index.html', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(SHELL).catch(() => undefined))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(names.filter((n) => n !== VERSION).map((n) => caches.delete(n))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Don't cache cross-origin or API traffic.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/v3/api-docs/')) {
    return;
  }

  // Hashed static assets — cache-first.
  if (/\.(?:js|css|woff2?|svg|png|jpg|jpeg|webp|ico|ttf)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // Navigation / HTML — network-first with shell fallback.
  event.respondWith(networkFirst(req));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(VERSION);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    return cached ?? Response.error();
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(VERSION);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return caches.match('/index.html');
  }
}
