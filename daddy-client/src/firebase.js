// Firebase configuration for Daddy Client
// Fill in the values from your Firebase console
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  where,
  limit,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// ⚠️  Replace placeholders with your actual Firebase config
// Copy these from Firebase Console → Project Settings → Your web app
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

let app, db, storage, messaging;
export let firebaseReady = false;

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
    messaging = typeof window !== 'undefined' ? getMessaging(app) : null;
    firebaseReady = true;
  }
} catch (e) {
  console.warn('[Daddy Firebase] init failed:', e.message);
}

export { db, storage, messaging };

// ─── FCM notification setup ────────────────────────────────────────────────

export async function requestNotificationPermission() {
  if (!messaging) return null;
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js'),
      });
      return token;
    }
  } catch (err) {
    console.warn('[FCM] Token failed:', err);
  }
  return null;
}

// ─── Messages ─────────────────────────────────────────────────────────────

export async function sendTextMessage(senderId, senderName, text) {
  if (!firebaseReady) throw new Error('Firebase not ready');
  return addDoc(collection(db, 'messages'), {
    senderId, senderName, type: 'text', text,
    timestamp: serverTimestamp(), read: false,
  });
}

export async function sendVoiceMessage(senderId, senderName, audioBlob) {
  if (!firebaseReady) throw new Error('Firebase not ready');
  const fileName = `voice-messages/${senderId}-${Date.now()}.webm`;
  const snap = await uploadBytes(ref(storage, fileName), audioBlob, { contentType: 'audio/webm' });
  const audioUrl = await getDownloadURL(snap.ref);
  return addDoc(collection(db, 'messages'), {
    senderId, senderName, type: 'voice', audioUrl,
    timestamp: serverTimestamp(), read: false,
  });
}

export function subscribeToMessages(callback) {
  if (!firebaseReady) return () => {};
  return onSnapshot(
    query(collection(db, 'messages'), orderBy('timestamp', 'asc'), limit(100)),
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
}

// ─── Calls ────────────────────────────────────────────────────────────────

export async function initiateCall(callerId, callerName, callType) {
  if (!firebaseReady) throw new Error('Firebase not ready');
  const docRef = await addDoc(collection(db, 'calls'), {
    callerId, callerName, type: callType,
    roomId: 'empy-daddy-room', status: 'ringing',
    timestamp: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateCallStatus(callId, status) {
  if (!firebaseReady) return;
  return updateDoc(doc(db, 'calls', callId), { status });
}

export function subscribeToIncomingCalls(listenForCallerId, callback) {
  if (!firebaseReady) return () => {};
  return onSnapshot(
    query(
      collection(db, 'calls'),
      where('callerId', '==', listenForCallerId),
      where('status', '==', 'ringing'),
      orderBy('timestamp', 'desc'),
      limit(1)
    ),
    (snap) => {
      if (!snap.empty) {
        const d = snap.docs[0];
        callback({ callId: d.id, ...d.data() });
      } else {
        callback(null);
      }
    }
  );
}

export function watchCallStatus(callId, callback) {
  if (!firebaseReady || !db) return () => {};
  return onSnapshot(doc(db, 'calls', callId), (snap) => {
    callback(snap.data()?.status);
  });
}

export { onMessage };
