// Service Worker v10 - Network First + Push Notifications + WebAPK Splash Fix
const CACHE_NAME = 'haedo-futsal-v10-nuclear-purge';

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

self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
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
  // Web Share Target Interception para comprobantes (intercepta POST o GET a /share-receipt)
  if (event.request.url.includes('/share-receipt')) {
    event.respondWith((async () => {
      try {
        if (event.request.method === 'POST') {
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
            
            const fileReq = new Request(new URL('/shared-receipt-file', self.location.origin).href);
            const jpgReq = new Request(new URL('/shared-receipt.jpg', self.location.origin).href);

            await cache.put(fileReq, new Response(file, { headers }));
            await cache.put(jpgReq, new Response(file, { headers }));
          }
        }
      } catch (err) {
        console.error('Error procesando comprobante compartido desde app:', err);
      }
      
      // Retornar respuesta HTTP 200 OK con HTML para forzar al Shell nativo de Android WebAPK a cerrar el Splash Screen
      const redirectTarget = new URL('/?shared=true', self.location.origin).href;
      const htmlResponse = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Cargando Comprobante - Haedo Futsal</title>
  <meta http-equiv="refresh" content="0; url=${redirectTarget}">
  <style>
    body {
      background-color: #020617;
      color: #f8fafc;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .spinner {
      width: 44px;
      height: 44px;
      border: 4px solid rgba(59, 130, 246, 0.2);
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 16px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="spinner"></div>
  <p style="font-weight: 600; font-size: 14px; letter-spacing: 0.5px;">Abriendo Haedo Futsal App...</p>
  <script>
    window.location.replace(${JSON.stringify(redirectTarget)});
  </script>
</body>
</html>`;

      return new Response(htmlResponse, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
        }
      });
    })());
    return;
  }

  // Network Only / Network First for JS, HTML and CSS assets
  event.respondWith(
    fetch(event.request, { cache: 'no-store' }).catch(() => {
      return caches.match(event.request);
    })
  );
});
