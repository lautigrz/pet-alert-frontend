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
  self.registration.showNotification(payload.notification?.title ?? 'PetFinder', {
    body: payload.notification?.body ?? '',
    icon: '/icons/icon-192.v1.png',
    badge: '/icons/icon-192.v1.png',
  });
});
