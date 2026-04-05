// Firebase Cloud Messaging Service Worker
// Uses Firebase Compat SDK (required for background messaging in service workers)
importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAkaYzpmlv1Hdd1Um86tfSdNCjLmHxFkkk',
  authDomain: 'week-planner-415a3.firebaseapp.com',
  projectId: 'week-planner-415a3',
  storageBucket: 'week-planner-415a3.firebasestorage.app',
  messagingSenderId: '687116621233',
  appId: '1:687116621233:web:c51514cc60f92f63229990',
});

const messaging = firebase.messaging();

// Handle background messages (app is closed or tab is not focused)
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? 'Week Planner';
  const body = payload.notification?.body ?? 'You have a new reminder';
  const clickAction = payload.data?.click_action ?? '/planner';

  self.registration.showNotification(title, {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    tag: payload.data?.tag ?? 'week-planner-notification',
    renotify: true,
    data: { click_action: clickAction },
  });
});

// Open app when notification is clicked
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.click_action ?? '/planner';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing tab if open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new tab
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
