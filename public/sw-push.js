// Predisposizione Web Push per il timer di recupero (step 7, decisione 3 del piano): handler pronti nel
// service worker, nessun server. Oggi nessuno invia push: gli avvisi arrivano solo con l'app aperta.
// Il contratto di un futuro endpoint è in docs/restyling/WEB-PUSH.md. Importato da sw.js
// (workbox-build, importScripts), quindi gli URL sono relativi al percorso base del service worker.

// Payload atteso (JSON): { "type": "rest-end", "title": "Recupero finito", "body": "Adesso: …", "tag": "<setId>" }
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  if (data.type !== 'rest-end') return;
  event.waitUntil(
    self.registration.showNotification(data.title || 'Recupero finito', {
      body: data.body || '',
      tag: data.tag || 'rest-end',
      renotify: true,
      requireInteraction: false,
      icon: new URL('icons/icon-192.png', self.registration.scope).href,
      data: { url: new URL('workout/', self.registration.scope).href },
    }),
  );
});

// Il tocco sulla notifica riporta all'allenamento: una finestra dell'app già aperta, altrimenti una nuova
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || self.registration.scope;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if (client.url.startsWith(self.registration.scope) && 'focus' in client) {
          return client.focus().then((focused) => (focused && 'navigate' in focused ? focused.navigate(url) : focused));
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
