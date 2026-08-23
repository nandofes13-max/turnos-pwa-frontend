// turnos-pwa-frontend/public/service-worker.js

// Nombre del caché (actualizar cuando se actualice la app)
const CACHE_NAME = 'pwa-turnos-v2'; // ← Aumentamos a v2 para forzar actualización

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

// Interceptar peticiones
// ESTRATEGIA: Network First (Red primero, luego caché)
self.addEventListener('fetch', (event) => {
  // Solo interceptar peticiones GET
  if (event.request.method !== 'GET') {
    return;
  }

  // NO interceptar peticiones a la API
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la petición es exitosa, clonar y cachear
        const responseClone = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseClone);
          });
        return response;
      })
      .catch(() => {
        // Si falla la red, intentar desde caché
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Si no está en caché y no hay red, mostrar offline
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            // Para otros recursos, retornar error
            throw new Error('Sin conexión');
          });
      })
  );
});

// Manejar notificaciones push (para el futuro)
self.addEventListener('push', (event) => {
  try {
    const data = event.data ? event.data.json() : {};
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
  } catch (error) {
    console.error('❌ Error en notificación push:', error);
  }
});

// Manejar clic en notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';
  event.waitUntil(
    clients.openWindow(urlToOpen)
  );
});
