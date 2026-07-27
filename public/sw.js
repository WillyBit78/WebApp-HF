// Service Worker v6 - Network Only para HTML/JS/CSS, sin cachés problemáticos
const CACHE_NAME = 'haedo-futsal-v6-clean-logo';

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Fuerza a que el SW v5 tome el control inmediatamente
});

self.addEventListener('activate', (event) => {
  // Limpiar TODOS los cachés de versiones anteriores (v1, v2, v3, v4, etc.)
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

  // Para todo lo demás: consultar siempre al servidor (Network Only / No Cache in SW)
  // Dejamos que el navegador maneje su propio HTTP cache de Vercel (ETags/max-age)
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
