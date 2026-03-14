const CACHE_NAME = 'maths-indse-pwa-v1';
const PRECACHE_URLS = [
  '/',
  '/manifest.json'
];

// Installation : Mise en cache initiale
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activation : Nettoyage des anciens caches si changement de version
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch : Stratégie "Network First"
self.addEventListener('fetch', (event) => {
  // Uniquement pour les requêtes GET (on ignore POST, etc.)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // On clone la réponse réseau valide pour la mettre en cache
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Si le réseau échoue (mode hors ligne), on renvoie le cache
        return caches.match(event.request);
      })
  );
});
