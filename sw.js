const CACHE = 'img-tech-shell-v4';
const SHELL = [
  '/painel-img-tech',
  '/admin.css',
  '/admin-future.css',
  '/admin-stock.css',
  '/admin-img-tech.css',
  '/login.css',
  '/login-img-tech.css',
  '/public-results.css',
  '/iphone-3d.js',
  '/warranty-terms.js',
  '/assets/img-tech-logo-v2.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== location.origin) return;
  event.respondWith(fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request)));
});
