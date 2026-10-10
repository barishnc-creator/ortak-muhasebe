self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_) {
    data = { body: event.data ? event.data.text() : '' };
  }

  event.waitUntil(self.registration.showNotification(
    data.title || 'Yeni katalog siparişi',
    {
      body: data.body || 'Yeni bir katalog siparişi var.',
      data: { url: data.url || './index.html' }
    }
  ));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(
    (event.notification.data && event.notification.data.url) || './index.html',
    self.location.origin
  ).href;

  event.waitUntil(clients.openWindow(url));
});