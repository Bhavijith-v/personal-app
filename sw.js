/* Deposit Box — offline shell.
   This worker caches the app's own files and its two webfonts so the app opens
   with no network at all after the first visit. It never sees your vault: the
   encrypted blob lives in localStorage, which a service worker cannot read. */

/* Bump this whenever you change index.html so phones pick the new version up.
   Changing this string is what makes the browser reinstall the worker. */
const CACHE = 'depositbox-v9';

const SHELL = [
  './',
  './index.html',
  './lib/argon2.umd.min.js',
  './assets/race-week-2026.webp',
  './assets/race-georgian-2026.webp',
  './assets/race-peekay-2026.webp',
  './assets/race-navy-2026.webp',
  './assets/race-peringode-2027.webp',
  './manifest.webmanifest',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.allSettled(SHELL.map((url) => c.add(new Request(url, { cache: 'reload' })))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isFont = FONT_HOSTS.includes(url.hostname);
  if (!sameOrigin && !isFont) return;

  const save = (res) => {
    // Opaque font responses are cacheable even though we cannot inspect them.
    if (res && (res.ok || res.type === 'opaque')) {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
    }
    return res;
  };

  // The page itself goes network-first, so a redeployed version actually
  // reaches the phone instead of being pinned to whatever was cached first.
  // Offline, the cached copy answers immediately.
  if (req.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(req).then(save).catch(() =>
        caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('./index.html'))
      )
    );
    return;
  }

  // Everything else — icons, manifest, fonts — is immutable enough to serve
  // from cache straight away.
  event.respondWith(
    caches.match(req, { ignoreSearch: sameOrigin }).then((hit) =>
      hit || fetch(req).then(save).catch(() => new Response('', { status: 504, statusText: 'Offline' }))
    )
  );
});
