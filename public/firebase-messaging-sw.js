importScripts('https://www.gstatic.com/firebasejs/12.15.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.15.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyD-w28-xuqLiiUBLcBgSshDlJDrJyFKF0c',
  authDomain: 'petfinder-ad209.firebaseapp.com',
  projectId: 'petfinder-ad209',
  storageBucket: 'petfinder-ad209.firebasestorage.app',
  messagingSenderId: '14232690054',
  appId: '1:14232690054:web:a017ff02c44f4017956007',
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
