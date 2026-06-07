const CACHE = 'powned-v1';
const SHELL = ['/', '/login'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // Always fetch API calls fresh from network
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(fetch(request).catch(() => new Response('{"error":"offline"}', { headers: { 'Content-Type': 'application/json' } })));
    return;
  }

  // Network-first for navigation, cache fallback
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then(res => { caches.open(CACHE).then(c => c.put(request, res.clone())); return res; })
        .catch(() => caches.match(request).then(r => r || caches.match('/')))
    );
    return;
  }

  // Cache-first for static assets
  e.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(res => {
      if (res.ok && !url.pathname.startsWith('/_next/')) {
        caches.open(CACHE).then(c => c.put(request, res.clone()));
      }
      return res;
    }))
  );
});
