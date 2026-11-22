const CACHE = 'homeflowe-gobelen-photos-20261122';
// Catalogue data is deliberately excluded: it is versioned by the build and
// must always be requested from the network when a new site version opens.
const SHELL = ['./', './index.html', './manifest.webmanifest', '/catalog-photo-map-dd4324d97ae6.js', '/catalog-photos.js?v=20261122', './images/icon-192.png', './images/icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE && (key.startsWith('homeflowe-gobelen-photos-') || /^homeflowe-catalog-v[0-9]+$/.test(key))).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin === self.location.origin && (url.pathname.endsWith('/catalog-data.js') || url.pathname.endsWith('/catalog-live.js') || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/'))) {
    event.respondWith(fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match(event.request)));
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (response.ok && new URL(event.request.url).origin === self.location.origin) {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
      }
      return response;
    }))
  );
});
