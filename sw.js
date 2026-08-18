const CACHE_NAME = 'wirahasta-p2p-v0.12-cache-v1';

// Daftar aset static lokal yang wajib dicache
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './assets/js/tailwindcss.js',
  './assets/js/dexie.js',
  './assets/js/peerjs.min.js',
  './assets/css/all.min.css',
  './assets/icons/icon-192x192.png',
  './assets/icons/icon-512x512.png'
];

// 1. Install Event: Caching static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing SW & Caching Assets...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching App Shell');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Cleanup cache lama jika ada update versi
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating SW...');
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Cache First, Fallback to Network Strategy
self.addEventListener('fetch', (event) => {
  // Abaikan request non-GET atau request protokol non-http/https (seperti chrome-extension)
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Simpan response baru ke cache secara dinamis jika request valid
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Fallback opsional jika koneksi gagal penuh
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});
