// turnos-pwa-frontend/public/service-worker.js

// Nombre del caché (actualizar cuando se actualice la app)
const CACHE_NAME = 'pwa-turnos-v1';

// Archivos a cachear para que funcionen sin conexión
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo-pwa-turnos.svg',
  '/1000133565.png',
  '/agenda.png',
  // Agregar aquí otros archivos estáticos que quieras cachear
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✅ Cache abierto');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Archivos cacheados correctamente');
        return self.skipWaiting(); // Activar el SW inmediatamente
      })
      .catch((error) => {
        console.error('❌ Error al cachear archivos:', error);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Eliminando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('✅ Service Worker activado');
      return self.clients.claim(); // Tomar control de todas las pestañas
    })
  );
});

// Interceptar peticiones y servir desde caché si está disponible
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Si está en caché, devolverlo
        if (response) {
          return response;
        }
        // Si no, ir a la red
        return fetch(event.request)
          .then((response) => {
            // Clonar la respuesta para cachearla
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseClone);
              });
            return response;
          })
          .catch((error) => {
            console.error('❌ Error en fetch:', error);
            // Retornar una página de error offline si existe
            return caches.match('/offline.html');
          });
      })
  );
});

// Manejar notificaciones push (para el futuro)
self.addEventListener('push', (event) => {
  const data = event.data.json();
  const options = {
    body: data.body || 'Nueva notificación',
    icon: '/logo-pwa-turnos.svg',
    badge: '/logo-pwa-turnos.svg',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'PWA-Turnos', options)
  );
});

// Manejar clic en notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';
  event.waitUntil(
    clients.openWindow(urlToOpen)
  );
});
