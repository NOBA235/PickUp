/**
 * PickUp Offline Service Worker (Phase 6)
 * Enables offline installation and local caching with zero external network requests.
 * Stale-while-revalidate for assets, with navigation fallback to index.html.
 */

const CACHE_NAME = 'pickup-cache-v1';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// Install Event: pre-cache application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn('[PickUp:SW] Precache failed during install:', err);
      })
  );
});

// Activate Event: purge stale caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch Event: Stale-While-Revalidate with offline navigation fallback
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle GET requests and http/https schemes
  if (request.method !== 'GET') return;
  if (!request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Background network fetch to keep cache up to date
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === 'basic'
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and navigating to a page, serve cached index.html
          if (request.mode === 'navigate') {
            return caches.match('./index.html').then((indexFallback) => {
              return indexFallback || caches.match('./');
            });
          }
          return null;
        });

      // Return cached asset immediately if found, else wait for network
      return cachedResponse || fetchPromise;
    })
  );
});
