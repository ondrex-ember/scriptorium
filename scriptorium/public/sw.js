// ═══════════════════════════════════════════════════════
// SCRIPTORIUM – Service Worker v2
// ⚠️  DŮLEŽITÉ: Při každém deploymentu zvyš číslo verze!
//     Jinak uživatelé dostanou starý obsah z cache.
// ═══════════════════════════════════════════════════════
const CACHE_NAME = 'scriptorium-v2';

// Soubory cachované při instalaci (precache)
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// ── INSTALL ──────────────────────────────────────────────
// Při prvním načtení SW: stáhni a ulož klíčové soubory
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE ─────────────────────────────────────────────
// Smaž všechny cache se starým názvem
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('🗑️ Mažu starou cache:', key);
            return caches.delete(key);
          })
      ))
      .then(() => self.clients.claim())
  );
});

// ── FETCH ─────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Ignoruj non-GET requesty (localStorage, POST apod.)
  if (event.request.method !== 'GET') return;

  // Ignoruj Chrome extensions a jiné non-http
  if (!url.protocol.startsWith('http')) return;

  // ── EXTERNÍ requesty (GA4, Google Fonts, CDN) ──────────
  // Network-first: pokus o síť, při offline tiše selže
  if (url.origin !== self.location.origin) {
    event.respondWith(
      fetch(event.request)
        .catch(() => new Response('', {
          status: 503,
          statusText: 'Offline - external resource unavailable'
        }))
    );
    return;
  }

  // ── VLASTNÍ soubory – Cache-first ──────────────────────
  // 1. Zkus cache
  // 2. Pokud není → fetch ze sítě + ulož do cache
  // 3. Pokud offline a v cache není → SPA fallback (index.html)
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) {
          // Cache hit – vrať okamžitě, ale na pozadí revaliduj
          const fetchPromise = fetch(event.request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, networkResponse.clone()));
            }
            return networkResponse;
          }).catch(() => {}); // Tiché selhání revalidace offline
          return cached;
        }

        // Cache miss – jdi na síť
        return fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200 || response.type === 'opaque') {
              return response;
            }
            const clone = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, clone));
            return response;
          })
          .catch(() => {
            // Offline + cache miss → SPA fallback
            return caches.match('/index.html');
          });
      })
  );
});