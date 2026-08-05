self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data?.text() }; }
  const title = data.title || 'Perros App';
  const options = {
    body: data.body || 'Tienes una nueva notificación.',
    icon: '/app-icon.svg',
    badge: '/app-icon.svg',
    tag: data.tag || 'perros-app',
    renotify: Boolean(data.renotify),
    data: { url: data.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const destination = new URL(event.notification.data?.url || '/', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => client.url.startsWith(self.location.origin));
      if (existing) { existing.navigate(destination); return existing.focus(); }
      return self.clients.openWindow(destination);
    })
  );
});
