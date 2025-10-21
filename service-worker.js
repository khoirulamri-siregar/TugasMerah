const CACHE_NAME = 'tugasmerah-v1.4'; // Ganti versi cache agar cache lama dihapus
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

// Fetch event (Cache First then Network)
self.addEventListener('fetch', event => {
  // Hanya tangani GET request, lewati request POST, dll.
  if (event.request.method !== 'GET') return; 

  console.log('Service Worker: Fetching', event.request.url);
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Jika ada di cache, kirim dari cache
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Jika tidak ada di cache, ambil dari network
        return fetch(event.request)
          .then(res => {
            // Cek jika response valid
            if (!res || res.status !== 200 || res.type !== 'basic') {
              return res;
            }
            
            // Simpan salinan response ke cache
            const resClone = res.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, resClone);
              });
            return res;
          })
          .catch(err => {
            console.log('Service Worker: Fetch failed; returning offline page or error.', err);
            // Anda bisa mengembalikan halaman offline di sini jika diperlukan
          });
      })
  );
});

// =========================================================
// NEW: Event Listener untuk menangani klik Notifikasi Sistem
// =========================================================
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked: ', event.notification.tag);
  event.notification.close();

  event.waitUntil(
    clients.matchAll({
      type: 'window'
    })
    .then(clientList => {
      // Cari jika ada window aplikasi yang sudah terbuka
      for (const client of clientList) {
        if (client.url.includes('/dashboard.html') && 'focus' in client) {
          // Jika ada, fokuskan ke window tersebut
          return client.focus();
        }
      }
      
      // Jika belum ada window yang terbuka, buka window baru ke halaman dashboard
      if (clients.openWindow) {
        return clients.openWindow('/dashboard.html');
      }
    })
  );
});
