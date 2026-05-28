self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((client) => 'focus' in client);
        if (existing) return existing.focus();
        if (self.clients.openWindow) return self.clients.openWindow('/');
        return undefined;
      }),
  );
});
