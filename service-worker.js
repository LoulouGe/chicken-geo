const CACHE_NAME = 'chicken-geo-v18';

// Install event - cache app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache known local assets
      const localAssets = [
        '/',
        '/chicken-geo/',
        '/index.html',
        '/style.css?v=18',
        '/script.js?v=18',
        '/countries.json',
        '/manifest.json',
      ];
      return cache.addAll(localAssets).catch(() => {
        // If any fail, continue anyway
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip non-GET requests and third-party requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        return response;
      }
      return fetch(event.request)
        .then(response => {
          // Cache successful responses dynamically
          if (response && response.status === 200 && response.type !== 'basic') {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return offline page or cached resource as fallback
          return caches.match('/index.html');
        });
    })
  );
});
