// Service Worker v7 - Network Only + Push Notifications
const CACHE_NAME = 'haedo-futsal-v7-push-enabled';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Push Notification Event Handler (Celular Cerrado / Bloqueado)
self.addEventListener('push', (event) => {
  let data = {
    title: 'Haedo Futsal - Nuevo Comunicado',
    body: 'Tienes una nueva novedad importante del club.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: '/?tab=notices' }
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: data.tag || `haedo-notice-${Date.now()}`,
    renotify: true,
    data: data.data || { url: '/?tab=notices' },
    actions: [
      { action: 'open', title: 'Ver Comunicado 📢' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/?tab=notices';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Web Share Target Interception para comprobantes
  if (event.request.method === 'POST' && event.request.url.includes('/share-receipt')) {
    event.respondWith((async () => {
      try {
        const formData = await event.request.formData();
        const file = formData.get('receiptImage');
        
        if (file) {
          const cache = await caches.open('shared-receipts');
          await cache.put(
            new Request('/shared-receipt.jpg'),
            new Response(file, {
              headers: {
                'Content-Type': file.type,
                'Content-Length': file.size
              }
            })
          );
        }
      } catch (err) {
        console.error('Error procesando imagen compartida', err);
      }
      return Response.redirect('/?shared=true', 303);
    })());
    return;
  }

  // Network Only fallback
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
