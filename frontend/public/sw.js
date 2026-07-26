// Service Worker for Aspira PWA & Push Notifications

self.addEventListener('install', (event) => {
  console.log('Aspira Service Worker: Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Aspira Service Worker: Activated.');
  event.waitUntil(self.clients.claim());
});

// Handle incoming Push Notification events
self.addEventListener('push', (event) => {
  console.log('Aspira Service Worker: Push notification received.');
  
  let data = {
    title: 'Aspira Alert',
    body: 'You have a new update in your Aspira workspace.',
    icon: '/logo.jpg',
    url: '/dashboard'
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      // Fallback to text payload if not JSON formatted
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/logo.jpg',
    badge: '/logo.jpg',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/dashboard'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle push notification click events
self.addEventListener('notificationclick', (event) => {
  console.log('Push Notification clicked.');
  event.notification.close();

  const targetUrl = event.notification.data.url;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // If a window is already open, focus it and navigate to targetUrl
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url && 'focus' in client) {
            client.focus();
            if (client.navigate) {
              return client.navigate(targetUrl);
            }
          }
        }
        // If no window is open, open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
