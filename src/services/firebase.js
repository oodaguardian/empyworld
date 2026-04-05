// Firebase service — uses compat SDK loaded from CDN in index.html
// No npm imports needed — accesses window.firebase global

const cfg = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let _db = null;
let _storage = null;
let firebaseReady = false;

function _init() {
  if (firebaseReady) return;
  try {
    if (!cfg.apiKey || !cfg.projectId) return;
    const fb = window.firebase;
    if (!fb) { console.warn('[Firebase] CDN not loaded yet'); return; }
    if (!fb.apps.length) fb.initializeApp(cfg);
    _db = fb.firestore();
    _storage = fb.storage();
    firebaseReady = true;
  } catch (e) {
    console.warn('[Firebase] init failed:', e.message);
  }
}

// Lazy init — called on first use so CDN scripts have time to load
function db() { _init(); return _db; }
function storage() { _init(); return _storage; }

export { firebaseReady };
export { _db as db, _storage as storage };

// ─── Messages ────────────────────────────────────────────────────────────────

export async function sendTextMessage(senderId, senderName, text) {
  _init();
  if (!firebaseReady) throw new Error('Firebase not configured');
  return db().collection('messages').add({
    senderId, senderName, type: 'text', text,
    timestamp: window.firebase.firestore.FieldValue.serverTimestamp(),
    read: false,
  });
}

export async function sendVoiceMessage(senderId, senderName, audioBlob) {
  _init();
  if (!firebaseReady) throw new Error('Firebase not configured');
  const fileName = `voice-messages/${senderId}-${Date.now()}.webm`;
  const snap = await storage().ref(fileName).put(audioBlob, { contentType: 'audio/webm' });
  const audioUrl = await snap.ref.getDownloadURL();
  return db().collection('messages').add({
    senderId, senderName, type: 'voice', audioUrl,
    timestamp: window.firebase.firestore.FieldValue.serverTimestamp(),
    read: false,
  });
}

export function subscribeToMessages(callback) {
  _init();
  if (!firebaseReady) return () => {};
  return db()
    .collection('messages')
    .orderBy('timestamp', 'asc')
    .limit(100)
    .onSnapshot((snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

// ─── Calls ───────────────────────────────────────────────────────────────────

export async function initiateCall(callerId, callerName, callType) {
  _init();
  if (!firebaseReady) throw new Error('Firebase not configured');
  const ref = await db().collection('calls').add({
    callerId, callerName,
    type: callType,
    roomId: 'empy-daddy-room',
    status: 'ringing',
    timestamp: window.firebase.firestore.FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function updateCallStatus(callId, status) {
  _init();
  if (!firebaseReady) return;
  return db().collection('calls').doc(callId).update({ status });
}

export function subscribeToIncomingCalls(listenForCallerId, callback) {
  _init();
  if (!firebaseReady) return () => {};
  return db().collection('calls')
    .where('callerId', '==', listenForCallerId)
    .where('status', '==', 'ringing')
    .orderBy('timestamp', 'desc')
    .limit(1)
    .onSnapshot((snap) => {
      if (!snap.empty) {
        const d = snap.docs[0];
        callback({ callId: d.id, ...d.data() });
      } else {
        callback(null);
      }
    });
}

export function watchCallStatus(callId, callback) {
  _init();
  if (!firebaseReady || !callId) return () => {};
  return db().collection('calls').doc(callId)
    .onSnapshot((snap) => callback(snap.data()?.status));
}

