// public/sw.js — Empy World Service Worker
// Handles: Web Push notifications + PWA offline caching

const CACHE_NAME = 'empyworld-v2';
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

  if (action === 'decline') {
    // Post to all clients to decline the call
    clients.matchAll({ type: 'window' }).then((cls) =>
      cls.forEach((c) => c.postMessage({ type: 'DECLINE_CALL', callId: data.callId }))
    );
    return;
  }

  // Open / accept — focus or open window
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cls) => {
      if (cls.length > 0) {
        cls[0].focus();
        cls[0].postMessage({ type: action === 'accept' ? 'ACCEPT_CALL' : 'OPEN_APP', callId: data.callId });
      } else {
        clients.openWindow('/');
      }
    })
  );
});

// ── Network-first fetch ──────────────────────────────────────────────────────
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;
  const hasRange = req.headers.has('range');
  const isBunnyApi = isSameOrigin && url.pathname.startsWith('/api/bunny/');
  const isMedia = req.destination === 'video' || req.destination === 'audio';

  // Never intercept media/range/bunny-streaming requests.
  // Range responses are often 206 and cannot be safely cached via Cache API.
  if (req.method !== 'GET' || !isSameOrigin || hasRange || isBunnyApi || isMedia) return;

  e.respondWith(
    fetch(req)
      .then((resp) => {
        if (resp.ok && resp.status === 200 && resp.type === 'basic') {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, clone));
        }
        return resp;
      })
      .catch(async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        if (req.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return Response.error();
      })
  );
});
