// Firebase Cloud Messaging Service Worker
// This file MUST be at /firebase-messaging-sw.js (root of public dir)
// It handles background push notifications (when app is closed/in background)

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// IMPORTANT: Replace with your actual Firebase config values
// These must match VITE_FIREBASE_* in your .env.local
firebase.initializeApp({
  apiKey:            'AIzaSyCuyZ2A3I0lHNevVrvrNVVRdw0461WK3bw',
  authDomain:        'empyworld-2efd2.firebaseapp.com',
  projectId:         'empyworld-2efd2',
  storageBucket:     'empyworld-2efd2.firebasestorage.app',
  messagingSenderId: '189873359702',
  appId:             '1:189873359702:web:8ed39d3e02207c117624f7',
});

const messaging = firebase.messaging();

// Handle background push notifications
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  const isCall = payload.data?.type === 'call';

  self.registration.showNotification(title || "Empy's World 🌸", {
    body: body || 'You have a new notification',
    icon: icon || '/empyxvc.png',
    badge: '/empyxvc.png',
    vibrate: isCall ? [200, 100, 200, 100, 200] : [100],
    requireInteraction: isCall, // keep on screen for calls
    tag: isCall ? 'incoming-call' : 'message',
    data: payload.data,
    actions: isCall
      ? [
          { action: 'accept', title: '✅ Accept' },
          { action: 'decline', title: '❌ Decline' },
        ]
      : [],
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      return clients.openWindow('/');
    })
  );
});
