// Service Worker for Atomify PWA
const CACHE_NAME = 'atomify-v1.0.0';
const urlsToCache = [
  '/',
  '/app/isomers.html',
  '/app/chestionare.html',
  '/app/calcule.html',
  '/app/leaderboard.html',
  '/app/equations.html',
  '/app/masa.html',
  '/app/profile.html',
  '/app/istoric.html',
  '/app/admin.html',
  '/app/style.css',
  '/app/logo_light.png',
  '/app/logo_dark.png',
  '/app/logo-theme-switcher.js',
  '/app/google-translate.js',
  '/app/pwa.js',
  '/styles.css',
  '/logo.png',
  '/index.html',
  '/privacy.html',
  '/manifest.json',
  '/sw.js'
];

// Install event - cache all the files
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('All resources cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Cache failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache when available, always require network for data
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version for static assets, but require network for data
        if (response && !event.request.url.includes('/api/')) {
          console.log('Serving from cache:', event.request.url);
          return response;
        }
        
        console.log('Fetching from network:', event.request.url);
        return fetch(event.request)
          .then(response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache the fetched resource
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(error => {
            console.error('Fetch failed:', error);
            
            // Return error for navigation requests when offline
            if (event.request.mode === 'navigate') {
              return new Response('Internet connection required', {
                status: 503,
                statusText: 'Service Unavailable - Internet connection required'
              });
            }
          });
      })
  );
});

// Background sync for app updates
self.addEventListener('sync', event => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Handle app updates and notifications
  console.log('Performing background sync...');
  return Promise.resolve();
}

// Push notification handling
self.addEventListener('push', event => {
  console.log('Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Nouă notificare de la Atomify!',
    icon: '/app/logo_light.png',
    badge: '/app/logo_light.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Deschide',
        icon: '/app/logo_light.png'
      },
      {
        action: 'close',
        title: 'Închide',
        icon: '/app/logo_light.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Atomify', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/app/isomers.html')
    );
  }
}); 