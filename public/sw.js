const CACHE_NAME = 'aithss-bio-v6';
const ASSETS = [
  '/',
  '/index.html',
  '/vendor/phosphor/regular/style.css?v=2.1.2',
  '/vendor/phosphor/regular/Phosphor.woff2',
  '/vendor/phosphor/fill/style.css?v=2.1.2',
  '/vendor/phosphor/fill/Phosphor-Fill.woff2',
  '/css/style.css?v=5',
  '/css/admin.css?v=5',
  '/js/icons.js?v=5',
  '/js/qr.js',
  '/js/app.js?v=5',
  '/js/admin.js?v=5',
  '/manifest.json',
  '/assets/favicon.svg',
  '/assets/icon-192.png',
  '/assets/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Pass through API calls to network always
  if (e.request.url.includes('/api/')) {
    return;
  }

  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request).catch(() => caches.match('/'));
    })
  );
});
