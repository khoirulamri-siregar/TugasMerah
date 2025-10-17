const CACHE_NAME = 'tugasmerah-v1.3';
const urlsToCache = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/icon-192.png',
  '/icon-512.png',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// Install event
self.addEventListener('install', event => {
  console.log('Service Worker: Installed');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching Files');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event
self.addEventListener('activate', event => {
  console.log('Service Worker: Activated');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing Old Cache');
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  console.log('Service Worker: Fetching');
  event.respondWith(
    fetch(event.request)
      .then(res => {
        // Make copy/clone of response
        const resClone = res.clone();
        // Open cache
        caches.open(CACHE_NAME)
          .then(cache => {
            // Add response to cache
            cache.put(event.request, resClone);
          });
        return res;
      })
      .catch(err => caches.match(event.request).then(res => res))
  );
});
