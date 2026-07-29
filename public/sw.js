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
    icon: data.icon || '/logo_192.png',
    badge: data.badge || '/logo_192.png',
    vibrate: [300, 100, 300, 100, 300],
    tag: data.tag || `haedo-notice-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    timestamp: Date.now(),
    data: data.data || { url: '/?tab=notices' },
    actions: [
      { action: 'open', title: 'Abrir Haedo Futsal App 📢' }
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
        let file = null;

        // Probar nombres comunes de campos de archivos usados por Personal Pay, MP, Mercado Pago, Cuenta DNI, etc.
        const possibleKeys = ['receiptImage', 'file', 'image', 'media', 'attachment', 'document', 'pdf'];
        for (const k of possibleKeys) {
          const cand = formData.get(k);
          if (cand && typeof cand === 'object' && (cand.name || cand.size)) {
            file = cand;
            break;
          }
        }

        // Búsqueda exhaustiva si no se encontró con nombres comunes
        if (!file) {
          for (const [key, value] of formData.entries()) {
            if (value && typeof value === 'object' && (value.name || value.size)) {
              file = value;
              break;
            }
          }
        }

        if (file) {
          const cache = await caches.open('shared-receipts');
          const mimeType = file.type || (file.name && file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
          const headers = {
            'Content-Type': mimeType,
            'X-File-Name': file.name || (mimeType === 'application/pdf' ? 'comprobante_compartido.pdf' : 'comprobante_compartido.jpg')
          };
          
          await cache.put(new Request('/shared-receipt-file'), new Response(file, { headers }));
          await cache.put(new Request('/shared-receipt.jpg'), new Response(file, { headers }));
        }
      } catch (err) {
        console.error('Error procesando comprobante compartido desde app:', err);
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
