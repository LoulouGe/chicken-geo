const CACHE_NAME = 'chicken-geo-v1';
const URLS_TO_CACHE = [
  '/',
  '/chicken-geo/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/countries.json',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Poppins:wght@400;600;700&display=swap',
  'https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD-vgNJwUr3WG8tNUf_BvLIIVN8dLRnWtL8F1eKvXwEZpd8SkCg.0.woff2',
  'https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD-vgNJwUr3WG8tNUf_BvLIIVN8dLRnWtL8F1eKvXwEZpd8SkCg.900.woff2#async',
  'https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLFj_Z1xlFd2JQEl1qsFd_E8XW98.woff2',
];

// Install event - cache app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache known local assets
      const localAssets = [
        '/',
        '/chicken-geo/',
        '/index.html',
        '/style.css',
        '/script.js',
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
