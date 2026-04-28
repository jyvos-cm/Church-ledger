const CACHE_NAME = 'church-ledger-v5';
const ASSETS = [
  '/Church-ledger/',
  '/Church-ledger/index.html',
  '/Church-ledger/manifest.json',
  '/Church-ledger/icons/icon-192.png',
  '/Church-ledger/icons/icon-512.png',
  '/Church-ledger/html2pdf.bundle.min.js'
];

// Installation : mise en cache de tous les assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activation : suppression des anciens caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch : réseau d'abord, cache en fallback
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('/Church-ledger/')))
  );
});
