importScripts('https://www.gstatic.com/firebasejs/12.15.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.15.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDj5FubORs5b2mR-e_rW3Vy2Cuz47JUxsc',
  authDomain: 'petfinder-32e6a.firebaseapp.com',
  projectId: 'petfinder-32e6a',
  storageBucket: 'petfinder-32e6a.firebasestorage.app',
  messagingSenderId: '865991019769',
  appId: '1:865991019769:web:5536d0d867b5334cafe628',
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
