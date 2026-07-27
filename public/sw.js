// Service Worker para PWA Haedo Futsal
const CACHE_NAME = 'haedo-futsal-v4'; // v4: Network First para todo
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Fuerza a que el SW se active inmediatamente
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', (event) => {
  // Limpiar TODOS los cachés viejos
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Web Share Target Interception
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

  // TODAS las peticiones: Network First, fallback to Cache
  // Esto garantiza que los JS/CSS/imágenes nuevos se carguen siempre del servidor
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cachear la respuesta fresca para uso offline
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
