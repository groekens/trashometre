// ─────────────────────────────────────────────────────────────────────────────
// Trashomètre — Service Worker
// Strategies:
//   - Network-first for HTML (so users get latest deploys)
//   - Cache-first with revalidation for fonts and Chart.js (fast offline)
//   - Bypass for Firebase (let Firebase handle its own caching)
// ─────────────────────────────────────────────────────────────────────────────

const VERSION = 'v2.8.0';
const APP_CACHE    = `trashometre-app-${VERSION}`;
const ASSETS_CACHE = `trashometre-assets-${VERSION}`;

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './styles.css',
  './js/app.js',
  './js/i18n.js',
  './js/tarifs.js',
  './js/firebase-data.js',
];

// ── INSTALL: pre-cache the app shell ─────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(APP_CACHE).then(cache => cache.addAll(APP_SHELL))
  );
  // Don't auto-activate: wait for user to confirm via SKIP_WAITING message
});

// ── ACTIVATE: clean old caches ───────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys =>
        Promise.all(
          keys
            .filter(k => !k.endsWith(VERSION))
            .map(k => caches.delete(k))
        )
      ),
      self.clients.claim(),
    ])
  );
});

// ── MESSAGE: handle SKIP_WAITING from client ─────────────────────────────────
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── FETCH ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin, plus a few allowlisted CDNs
  const isFirebase = url.host.includes('firebase') ||
                     url.host.includes('googleapis') ||
                     url.host.includes('gstatic.com');
  const isCdnAsset = url.host === 'fonts.googleapis.com' ||
                     url.host === 'fonts.gstatic.com' ||
                     url.host === 'cdn.jsdelivr.net';
  const isSameOrigin = url.origin === self.location.origin;

  if (request.method !== 'GET') return;

  // Bypass Firebase entirely — they have their own caching
  if (isFirebase && !isCdnAsset) return;

  // App shell (HTML, JS, CSS): network-first, fallback to cache
  if (isSameOrigin) {
    event.respondWith(networkFirst(request, APP_CACHE));
    return;
  }

  // CDN assets (fonts, Chart.js): cache-first with background revalidation
  if (isCdnAsset) {
    event.respondWith(staleWhileRevalidate(request, ASSETS_CACHE));
    return;
  }
});

// ── STRATEGIES ───────────────────────────────────────────────────────────────
async function networkFirst(request, cacheName) {
  try {
    const networkRes = await fetch(request);
    if (networkRes && networkRes.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkRes.clone());
    }
    return networkRes;
  } catch (e) {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Final fallback for navigations
    if (request.mode === 'navigate') {
      const fallback = await caches.match('./index.html');
      if (fallback) return fallback;
    }
    throw e;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request).then(res => {
    if (res && res.ok) cache.put(request, res.clone());
    return res;
  }).catch(() => null);
  return cached || networkPromise;
}
