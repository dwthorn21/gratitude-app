const CACHE = 'gratitude-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest'
  // Note: external CDNs will be fetched network-first by the browser.
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => k !== CACHE ? caches.delete(k) : null));
    self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request);
    try {
      const fresh = await fetch(request);
      if (fresh && fresh.ok && request.url.startsWith(self.location.origin)) {
        cache.put(request, fresh.clone());
      }
      return fresh;
    } catch {
      return cached || new Response('Offline', { status: 503, headers: { 'Content-Type':'text/plain' }});
    }
  })());
});
