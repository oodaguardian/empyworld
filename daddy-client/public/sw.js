// public/sw.js — Empy World Service Worker
// Handles: Web Push notifications + PWA offline caching

const CACHE_NAME = 'empyworld-v1';
const PRECACHE = ['/', '/index.html'];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((c) => c.addAll(PRECACHE))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

// ── Push notifications ───────────────────────────────────────────────────────
self.addEventListener('push', (e) => {
  let data = {};
  try { data = e.data?.json() || {}; } catch { data = { title: e.data?.text() || 'Empy 🌸' }; }

  const isCall = data.data?.type === 'call';
  const title = data.title || "Empy's World 💕";
  const opts = {
    body: data.body || 'You have a new message',
    icon: '/empxvc.png',
    badge: '/empxvc.png',
    tag: isCall ? 'incoming-call' : 'message',
    renotify: true,
    requireInteraction: isCall,
    silent: false,
    vibrate: isCall ? [300, 100, 300, 100, 300, 100, 300, 100, 300] : [100, 50, 100],
    data: data.data || {},
    actions: isCall
      ? [
          { action: 'accept', title: '✅ Accept' },
          { action: 'decline', title: '❌ Decline' },
        ]
      : [{ action: 'open', title: '💌 Open' }],
  };

  e.waitUntil(self.registration.showNotification(title, opts));
});

// ── Notification click ───────────────────────────────────────────────────────
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const action = e.action;
  const data = e.notification.data || {};
  const isAccept = action === 'accept' || (!action && data.type === 'call');
  const isDecline = action === 'decline';

  // Open / action — focus existing window or open with action params
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cls) => {
      const msgType = isDecline ? 'DECLINE_CALL' : (isAccept ? 'ACCEPT_CALL' : 'OPEN_APP');
      const msg = {
        type: msgType,
        callId: data.callId,
        callType: data.callType,
      };

      if (cls.length > 0) {
        cls[0].focus();
        cls[0].postMessage(msg);
      } else if ((isAccept || isDecline) && data.callId) {
        // No window open — pass action + call info via URL so the app can pick it up on load
        const actionParam = isDecline ? 'decline' : 'accept';
        const url = '/?action=' + actionParam + '&callId=' + encodeURIComponent(data.callId) +
                    '&callType=' + encodeURIComponent(data.callType || 'video');
        clients.openWindow(url);
      } else {
        clients.openWindow('/');
      }
    })
  );
});

// ── Network-first fetch ──────────────────────────────────────────────────────
self.addEventListener('fetch', (e) => {
  // Skip non-GET and cross-origin
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    fetch(e.request)
      .then((resp) => {
        if (resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
        }
        return resp;
      })
      .catch(() => caches.match(e.request))
  );
});
