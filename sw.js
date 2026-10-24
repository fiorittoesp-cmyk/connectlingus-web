self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// No fetch listener needed — let the browser load all modules directly without Service Worker interception

// Recibe notificaciones Web Push reales (APNs en iPhone iOS y FCM en Android) incluso con la app cerrada o pantalla bloqueada
self.addEventListener('push', (event) => {
  let data = {
    title: 'Connect Lingus Community',
    body: 'Tienes un nuevo mensaje en tu buzón.',
    icon: '/icon-512.png?v=4',
    badge: '/badge-mono.png?v=6',
    tag: 'cl-push-msg'
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch (_) {
      data.body = event.data.text() || data.body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Connect Lingus Community', {
      body: data.body || '',
      icon: data.icon || '/icon-512.png?v=4',
      badge: '/badge-mono.png?v=6',
      tag: data.tag || `cl-push-${Date.now()}`,
      renotify: true,
      requireInteraction: false,
      silent: false,
      timestamp: Date.now(),
      vibrate: [200, 100, 200, 100, 300],
      data: { url: data.url || '/' }
    })
  );
});

// Al tocar la notificación estilo WhatsApp en el móvil, enfoca o abre la app en la pestaña indicada (ej. /?admin_tab=requests)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const rawUrl = (event.notification.data && event.notification.data.url) || '/';
  const absoluteTargetUrl = new URL(rawUrl, self.location.origin).href;

  event.waitUntil(
    (async () => {
      try {
        const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (const client of clientList) {
          try {
            client.postMessage({ type: 'CL_NOTIFICATION_CLICK', url: rawUrl });
          } catch (_) {}
          if ('focus' in client) {
            try {
              const focused = await client.focus();
              try {
                client.postMessage({ type: 'CL_NOTIFICATION_CLICK', url: rawUrl });
              } catch (_) {}
              if (focused) return focused;
            } catch (_) {}
          }
        }
      } catch (_) {}

      if (self.clients.openWindow) {
        return self.clients.openWindow(absoluteTargetUrl);
      }
    })()
  );
});
