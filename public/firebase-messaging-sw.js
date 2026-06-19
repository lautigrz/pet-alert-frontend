importScripts('https://www.gstatic.com/firebasejs/12.15.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.15.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAgvcC4Lnx3xIBDqXrZDETbxoqIsqLp9N4',
  authDomain: 'petfinder-dev-61120.firebaseapp.com',
  projectId: 'petfinder-dev-61120',
  storageBucket: 'petfinder-dev-61120.firebasestorage.app',
  messagingSenderId: '113752072304',
  appId: '1:113752072304:web:e6b54a2a45f796de6614b5',
});

firebase.messaging().onBackgroundMessage((payload) => {
  const data = payload.data ?? {};
  self.registration.showNotification(data.title || 'PetFinder', {
    body: data.body || '',
    icon: '/icons/icon-192.v1.png',
    badge: '/icons/icon-192.v1.png',
    data,
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const reportId = event.notification.data?.reportId;
  const target = new URL(reportId ? `/reports/${reportId}` : '/', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const exact = windowClients.find((client) => client.url === target);
      if (exact) return exact.focus();
      return self.clients.openWindow(target);
    }),
  );
});
