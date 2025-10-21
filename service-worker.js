// service-worker.js - Enhanced Version with Better Notification Handling
const CACHE_NAME = 'tugasmerah-v3.1';
const urlsToCache = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/admin-dashboard.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// Install event
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching App Shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Skip waiting');
        return self.skipWaiting();
      })
  );
});

// Activate event
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event with network-first strategy
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache the response if it's valid
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Enhanced Push Notification Handler
self.addEventListener('push', event => {
  console.log('Push Notification Received:', event);
  
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    console.log('Error parsing push data, using default:', error);
    data = {
      title: 'TugasMerah Reminder',
      body: 'Anda memiliki tugas yang perlu diselesaikan!',
      icon: '/icon-192.png',
      badge: '/icon-192.png'
    };
  }

  const options = {
    body: data.body || 'Deadline tugas mendekati! Segera selesaikan.',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    image: data.image,
    vibrate: [100, 50, 100],
    data: data.data || {
      url: data.url || '/dashboard.html',
      taskId: data.taskId,
      timestamp: new Date().toISOString()
    },
    actions: [
      {
        action: 'view',
        title: '📖 Lihat Tugas'
      },
      {
        action: 'snooze',
        title: '⏰ Tunda 1 Jam'
      }
    ],
    requireInteraction: true,
    tag: data.tag || 'tugasmerah-reminder',
    renotify: true,
    silent: false
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'TugasMerah', options)
      .then(() => {
        console.log('Notification shown successfully');
      })
      .catch(error => {
        console.error('Error showing notification:', error);
      })
  );
});

// Enhanced Notification Click Handler
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event.notification);
  
  event.notification.close();

  const notificationData = event.notification.data || {};
  const action = event.action;

  event.waitUntil(
    self.clients.matchAll({ 
      type: 'window',
      includeUncontrolled: true 
    }).then(clientList => {
      
      // Handle different actions
      if (action === 'snooze') {
        // Snooze logic would go here
        console.log('Snooze requested for task:', notificationData.taskId);
        return;
      }

      // Default action - open/focus the app
      const urlToOpen = notificationData.url || '/dashboard.html';
      
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            data: notificationData
          });
          return client.focus();
        }
      }
      
      // Open new window if app isn't open
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background Sync for offline functionality
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync-tasks') {
    console.log('Background sync for tasks triggered');
    event.waitUntil(syncTasks());
  }
});

async function syncTasks() {
  // Implement background sync logic here
  console.log('Syncing tasks in background...');
}

// Message handler for communication with main app
self.addEventListener('message', event => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'TEST_NOTIFICATION') {
    self.registration.showNotification('Test Notification', {
      body: 'Ini adalah notifikasi test dari TugasMerah',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'test-notification'
    });
  }
});
