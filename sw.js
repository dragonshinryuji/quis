/* QuizMaker Pro – Service Worker v1.0 */
const CACHE_NAME = 'quizmaker-pro-v2';
const ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

/* Install: cache core assets */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS.map(function(url) {
        return new Request(url, { cache: 'reload' });
      })).catch(function() {
        /* Silently ignore failed assets (e.g. icons not yet created) */
        return cache.addAll(['./index.html']);
      });
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

/* Activate: clean old caches */
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

/* Fetch: cache-first for local assets, network-first for external */
self.addEventListener('fetch', function(event) {
  var url = event.request.url;

  /* Skip non-GET requests */
  if (event.request.method !== 'GET') return;

  /* For Google Fonts and other external CDN – network first, fall back to cache */
  if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    event.respondWith(
      fetch(event.request).then(function(response) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, clone); });
        return response;
      }).catch(function() {
        return caches.match(event.request);
      })
    );
    return;
  }

  /* For local files – cache first, then network */
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return fetch(event.request).then(function(response) {
        if (!response || response.status !== 200) return response;
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, clone); });
        return response;
      });
    })
  );
});
