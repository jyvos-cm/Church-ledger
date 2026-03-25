// ═══════════════════════════════════════════════════════
// CHURCH LEDGER — SERVICE WORKER PWA v4
// Fonctionne 100% HORS LIGNE
// ═══════════════════════════════════════════════════════

const CACHE_NAME = 'church-ledger-v4';

// Tous les fichiers à mettre en cache au démarrage
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/sw.js',
  '/html2pdf.bundle.min.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// ── INSTALL : mise en cache de tous les assets ──
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Mise en cache initiale');
      return Promise.allSettled(
        PRECACHE_URLS.map(url =>
          cache.add(url).catch(err => console.log('[SW] Cache skip:', url))
        )
      );
    })
  );
});

// ── ACTIVATE : nettoyage des anciens caches ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('[SW] Suppression ancien cache:', k);
          return caches.delete(k);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH : Cache-first pour tout (offline total) ──
self.addEventListener('fetch', event => {
  // Ignorer les requêtes non-GET
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // Ignorer les extensions Chrome et autres protocoles
  if (!url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      // Si en cache → servir immédiatement (offline-first)
      if (cached) return cached;

      // Sinon essayer le réseau et mettre en cache
      return fetch(event.request.clone()).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      }).catch(() => {
        // Pas de réseau, pas de cache → page fallback
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('', { status: 408, statusText: 'Hors ligne' });
      });
    })
  );
});
