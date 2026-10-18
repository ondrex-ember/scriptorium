// Sklářská Huť — Service Worker
//
// Dvě oddělené cache:
//   CORE  — HTML, kód (ui/*), manifest, ikony (~1,8 MB). Instaluje se atomicky.
//           ⚠️ Verzi zvedni při každém releasu (změna/přidání souboru z CORE_ASSETS).
//   MEDIA — obrázky (/img/**, ~49 MB). Plní se na pozadí (best-effort) po zprávě
//           CACHE_MEDIA z index.html, jinak průběžně při prvním použití.
//           Název je záměrně zachovaný z původního SW, takže už stažené obrázky
//           se nestahují znovu. Zvedni jen když se změní/přibudou obrázky.
//
// Strategie:
//   navigace + kód (CORE_ASSETS) → network-first s timeoutem → cache
//   obrázky (/img/**)            → cache-first
// Update: nový SW čeká na zprávu SKIP_WAITING (toast v index.html), žádný
// skipWaiting při instalaci a žádný automatický reload.

const CORE = 'sklarska-hut-woodland-v1.24-e2-cohesion';
const MEDIA = 'sklarska-hut-woodland-v1';
const PREFIX = 'sklarska-hut-';

const NAV_TIMEOUT = 4000;
const ASSET_TIMEOUT = 3000;
const MEDIA_CONCURRENCY = 4;

const CORE_ASSETS = [
  '/ui/fajrum-e1c-dialogs.js',
  '/ui/fajrum-e1c-dialogs.css',
  '/ui/fajrum-e1b-header.css',
  '/ui/fajrum-e1-hero.css',
  '/ui/fajrum-d7-shell.js',
  '/ui/fajrum-d7-shell.css',
  '/ui/fajrum-d6-archive.js',
  '/ui/fajrum-d6-archive.css',
  '/ui/fajrum-d5-chronicle.js',
  '/ui/fajrum-d5-chronicle.css',
  '/ui/fajrum-d4-workshop.js',
  '/ui/fajrum-d4-workshop.css',
  '/ui/fajrum-d3-storage.js',
  '/ui/fajrum-d3-storage.css',
  '/ui/fajrum-h1-contrast.css',
  '/ui/fajrum-d2-accounts.js',
  '/ui/fajrum-d2-accounts.css',
  '/ui/fajrum-d1-market.js',
  '/ui/fajrum-d1-market.css',
  '/ui/fajrum-c3-crew.js',
  '/ui/fajrum-c3-crew.css',
  '/ui/fajrum-c2b-furnace.js',
  '/ui/fajrum-c2b-furnace.css',
  '/ui/fajrum-c2a-workshop.js',
  '/ui/fajrum-c2a-workshop.css',
  '/index.html',
  '/about.html',
  '/intro.jpg',
  '/manifest.json',
  '/icons/icon-32.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon-180.png',
  '/ui/fajrum-partners.js',
  '/ui/fajrum-partners.css',
  '/ui/fajrum-stories.js',
  '/ui/fajrum-stories.css',
  '/ui/fajrum-worksites.js',
  '/ui/fajrum-worksites.css',
  '/ui/fajrum-desktop.js',
  '/ui/fajrum-desktop.css',
  '/ui/fajrum-portraits.js',
  '/ui/fajrum-portraits.css',
  '/ui/fajrum-mobile.css',
  '/ui/fajrum-ui.js',
  '/ui/grain.svg',
  '/ui/brass-corner.svg',
  '/ui/fajrum-overview.js',
  '/ui/fajrum-overview.css',
  '/ui/fajrum-artwork.js',
  '/ui/fajrum-artwork.css',
  '/ui/fajrum-products.js',
  '/ui/fajrum-products.css',
  '/ui/fajrum-recipes.js',
  '/ui/fajrum-recipe-ui.js',
  '/ui/fajrum-crew.js',
  '/ui/fajrum-crew.css',
  '/ui/fajrum-market.js',
  '/ui/fajrum-market.css',
  '/ui/fajrum-visuals.js',
  '/ui/fajrum-visuals.css'
];

const MEDIA_ASSETS = [
  '/img/ui/frame-brass.webp',
  '/img/ui/surface-paper.webp',
  '/img/ui/surface-sootwood.webp',
  '/img/ui/nav-hut.webp',
  '/img/ui/nav-workshop.webp',
  '/img/ui/nav-furnace.webp',
  '/img/ui/nav-storage.webp',
  '/img/ui/nav-crew.webp',
  '/img/ui/nav-market.webp',
  '/img/ui/nav-more.webp',
  '/img/ui/nav-accounts.webp',
  '/img/ui/nav-chronicle.webp',
  '/img/ui/nav-journal.webp',
  '/img/ui/nav-archive.webp',
  '/img/ui/nav-settings.webp',
  '/img/ui/coins.webp',
  '/img/world/hut-winter-thinned.webp',
  '/img/world/hut-spring-thinned.webp',
  '/img/world/hut-summer-thinned.webp',
  '/img/world/hut-autumn-thinned.webp',
  '/img/world/hut-winter-cleared.webp',
  '/img/world/hut-spring-cleared.webp',
  '/img/world/hut-summer-cleared.webp',
  '/img/world/hut-autumn-cleared.webp',
  '/img/partners/weiss.webp',
  '/img/partners/hoffmann.webp',
  '/img/partners/abbot.webp',
  '/img/partners/priest.webp',
  '/img/partners/nobleman.webp',
  '/img/partners/noblewoman.webp',
  '/img/events/crack.webp',
  '/img/events/good.webp',
  '/img/events/merchant.webp',
  '/img/events/winter.webp',
  '/img/events/shamotCrack.webp',
  '/img/events/forestDepleted.webp',
  '/img/events/svjiri.webp',
  '/img/achievements/ignis_mutat_res.webp',
  '/img/achievements/tercikar.webp',
  '/img/achievements/speculum.webp',
  '/img/achievements/kunckel.webp',
  '/img/achievements/reticello.webp',
  '/img/achievements/barokni_prelom.webp',
  '/img/achievements/ceska_pec.webp',
  '/img/achievements/cerenic_arsenem.webp',
  '/img/achievements/vilkum.webp',
  '/img/achievements/kobaltova_serie.webp',
  '/img/achievements/faccon_de_venise.webp',
  '/img/furnaces/primitive-cold.webp',
  '/img/furnaces/primitive-embers.webp',
  '/img/furnaces/primitive-hot.webp',
  '/img/furnaces/stone-cold.webp',
  '/img/furnaces/stone-embers.webp',
  '/img/furnaces/stone-hot.webp',
  '/img/furnaces/master-cold.webp',
  '/img/furnaces/master-embers.webp',
  '/img/furnaces/master-hot.webp',
  '/img/worksites/potash.webp',
  '/img/worksites/grinding.webp',
  '/img/worksites/engraving.webp',
  '/img/worksites/forestry.webp',
  '/img/workers/tomislav.webp',
  '/img/workers/npc_formar2.webp',
  '/img/workers/npc_foukac2.webp',
  '/img/workers/npc_foukac3.webp',
  '/img/workers/npc_foukac4.webp',
  '/img/workers/npc_foukac5.webp',
  '/img/workers/npc_foukac6.webp',
  '/img/workers/npc_hrana1.webp',
  '/img/workers/npc_kulic1.webp',
  '/img/workers/npc_rytec1.webp',
  '/img/materials/limestone.webp',
  '/img/materials/water.webp',
  '/img/materials/clay.webp',
  '/img/materials/shamot.webp',
  '/img/materials/food.webp',
  '/img/materials/charcoal.webp',
  '/img/materials/stone.webp',
  '/img/materials/dryWood.webp',
  '/img/materials/firebrick.webp',
  '/img/materials/pitch.webp',
  '/img/additives/smolka.webp',
  '/img/additives/burel.webp',
  '/img/additives/aesUstum.webp',
  '/img/additives/crocusMartis.webp',
  '/img/additives/cin.webp',
  '/img/additives/olovo.webp',
  '/img/additives/antimon.webp',
  '/img/additives/zlato.webp',
  '/img/additives/rtut.webp',
  '/img/additives/stribro.webp',
  '/img/additives/arsen.webp',
  '/img/sections/production.webp',
  '/img/sections/storage.webp',
  '/img/sections/market.webp',
  '/img/sections/accounts.webp',
  '/img/sections/chronicle.webp',
  '/img/sections/archive.webp',
  '/img/sections/commission-church.webp',
  '/img/sections/commission-noble.webp',
  '/img/sections/commission-trade.webp',
  '/img/materials/panev.webp',
  '/img/materials/formy.webp',
  '/img/materials/wood.webp',
  '/img/materials/potash.webp',
  '/img/materials/sand.webp',
  '/img/products/historical-catalogue.webp',
  '/img/products/hodiny.webp',
  '/img/products/glass-atlas-alpha.webp',
  '/img/products/glass-special-alpha.webp',
  '/img/products/mucholapka.webp',
  '/img/products/figurka.webp',
  '/img/products/kutrolf.webp',
  '/img/products/stangenglas.webp',
  '/img/products/tercik.webp',
  '/img/products/alembik.webp',
  '/img/world/hut-winter.webp',
  '/img/world/hut-spring.webp',
  '/img/world/hut-summer.webp',
  '/img/world/hut-autumn.webp',
  '/img/world/furnace-cold.webp',
  '/img/world/furnace-embers.webp',
  '/img/world/furnace-hot.webp',
  '/img/workers/baranovsky.jpg',
  '/img/workers/formar1.jpg',
  '/img/workers/foukac1.jpg',
  '/img/workers/kaninsky.jpg',
  '/img/workers/komar.jpg',
  '/img/workers/kunc.jpg',
  '/img/workers/mana.jpg',
  '/img/workers/smrkovsky.jpg',
  '/img/workers/taborsky.jpg'
];

const CORE_SET = new Set(CORE_ASSETS);
let mediaJob = null;

// ── Pomocné funkce ──

// Přesměrovaná odpověď nesmí být servírována navigaci → přebalit.
function clean(res) {
  if (!res.redirected) return res;
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: res.headers });
}

// Klíč v CORE cache pro navigaci (bez query → UTM varianty se nemnoží).
function navKey(url) {
  if (url.pathname === '/' || url.pathname === '/index.html') return '/index.html';
  if (url.pathname === '/about.html') return '/about.html';
  return null;
}

// Síť s timeoutem → cache. Když v cache nic není, čeká se na síť bez limitu.
async function networkFirst(req, key, ms) {
  const cache = await caches.open(CORE);
  const cached = await cache.match(key);
  const net = fetch(req).then(res => {
    if (res.type === 'opaqueredirect') return res;
    if (res.ok) {
      cache.put(key, clean(res.clone())).catch(() => {});
      return res;
    }
    return cached || res; // 404/5xx → radši poslední dobrá verze
  });
  net.catch(() => {});
  if (!cached) return net;
  return Promise.race([
    net,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
  ]).catch(() => cached);
}

async function navigateOther(req) {
  try {
    return await fetch(req);
  } catch (_) {
    const cache = await caches.open(CORE);
    return (await cache.match('/index.html')) || Response.error();
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(MEDIA);
  const hit = await cache.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone()).catch(() => {});
    return res;
  } catch (_) {
    return Response.error(); // chybějící obrázek = chyba, ne podvržené HTML
  }
}

async function precacheCore() {
  const cache = await caches.open(CORE);
  await Promise.all(CORE_ASSETS.map(async url => {
    const res = await fetch(new Request(url, { cache: 'reload' }));
    if (!res.ok) throw new Error('precache ' + url + ' ' + res.status);
    await cache.put(url, clean(res));
  }));
}

// Best-effort: jeden selhaný obrázek nic nerozbije; spustitelné opakovaně.
async function precacheMedia() {
  const cache = await caches.open(MEDIA);
  const queue = MEDIA_ASSETS.slice();
  let cached = 0;
  let failed = 0;
  async function worker() {
    while (queue.length) {
      const url = queue.shift();
      try {
        if (await cache.match(url)) { cached++; continue; }
        const res = await fetch(url);
        if (!res.ok) throw new Error(String(res.status));
        await cache.put(url, res);
        cached++;
      } catch (_) {
        failed++;
      }
    }
  }
  await Promise.all(Array.from({ length: MEDIA_CONCURRENCY }, worker));
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  clients.forEach(c => c.postMessage({ type: 'MEDIA_READY', cached, failed, total: MEDIA_ASSETS.length }));
}

// ── Životní cyklus ──

self.addEventListener('install', e => {
  e.waitUntil(precacheCore());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(k => k.startsWith(PREFIX) && k !== CORE && k !== MEDIA).map(k => caches.delete(k))
    );
    // MEDIA převzala název původní cache → odstranit z ní staré HTML/JS/CSS.
    const media = await caches.open(MEDIA);
    const reqs = await media.keys();
    await Promise.all(
      reqs.filter(r => !new URL(r.url).pathname.startsWith('/img/')).map(r => media.delete(r))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => {
  const d = e.data || {};
  if (d.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (d.type === 'CACHE_MEDIA') {
    if (!mediaJob) {
      mediaJob = precacheMedia().catch(() => {}).then(() => { mediaJob = null; });
    }
    e.waitUntil(mediaJob);
  }
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Cizí domény (GTM, GA, …) nechat na prohlížeči
  if (url.origin !== self.location.origin) return;
  if (req.headers.has('range')) return;

  if (req.mode === 'navigate') {
    const key = navKey(url);
    e.respondWith(key ? networkFirst(req, key, NAV_TIMEOUT) : navigateOther(req));
    return;
  }

  if (url.pathname.startsWith('/img/')) {
    e.respondWith(cacheFirst(req));
    return;
  }

  if (CORE_SET.has(url.pathname)) {
    e.respondWith(networkFirst(req, url.pathname, ASSET_TIMEOUT));
  }
  // vše ostatní (sw.js, og-image, …) řeší prohlížeč sám
});
