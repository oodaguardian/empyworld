// src/services/supabase.js — Supabase realtime messages + calls + Web Push
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL    = import.meta.env.VITE_SUPABASE_URL    || '';
const SUPABASE_ANON   = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const VAPID_PUBLIC    = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
const EDGE_PUSH_URL   = import.meta.env.VITE_SUPABASE_EDGE_PUSH_URL || '';

export let supabaseReady = Boolean(SUPABASE_URL && SUPABASE_ANON);

export const supabase = supabaseReady
  ? createClient(SUPABASE_URL, SUPABASE_ANON, {
      realtime: { params: { eventsPerSecond: 10 } },
    })
  : null;

// ─── Voice message storage (Supabase Storage bucket: "voice-messages") ───────

export async function uploadVoiceMessage(senderId, blob) {
  if (!supabaseReady) throw new Error('Supabase not configured');
  const fileName = `${senderId}-${Date.now()}.webm`;
  const { error } = await supabase.storage
    .from('voice-messages')
    .upload(fileName, blob, { contentType: 'audio/webm', upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('voice-messages').getPublicUrl(fileName);
  return data.publicUrl;
}

// ─── Messages ────────────────────────────────────────────────────────────────

export async function sendTextMessage(senderId, senderName, content) {
  if (!supabaseReady) throw new Error('Supabase not configured');
  const { error } = await supabase.from('messages').insert({
    sender_id: senderId, sender_name: senderName, type: 'text', content,
  });
  if (error) throw error;
}

export async function sendVoiceMessage(senderId, senderName, audioBlob) {
  if (!supabaseReady) throw new Error('Supabase not configured');
  const audioUrl = await uploadVoiceMessage(senderId, audioBlob);
  const { error } = await supabase.from('messages').insert({
    sender_id: senderId, sender_name: senderName, type: 'voice', audio_url: audioUrl,
  });
  if (error) throw error;
}

export function subscribeToMessages(callback) {
  if (!supabaseReady) return () => {};
  // Initial fetch
  supabase.from('messages').select('*').order('created_at', { ascending: true }).limit(100)
    .then(({ data }) => data && callback(data));

  // Realtime subscription
  const channel = supabase.channel('messages-channel')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => {
        supabase.from('messages').select('*').order('created_at', { ascending: true }).limit(100)
          .then(({ data }) => data && callback(data));
      })
    .subscribe();
  return () => supabase.removeChannel(channel);
}

export async function markMessagesRead(senderId) {
  if (!supabaseReady) return;
  await supabase.from('messages').update({ read: true }).eq('sender_id', senderId).eq('read', false);
}

// ─── Calls ───────────────────────────────────────────────────────────────────

export async function initiateCall(callerId, callerName, callType) {
  if (!supabaseReady) throw new Error('Supabase not configured');
  const { data, error } = await supabase.from('calls').insert({
    caller_id: callerId, caller_name: callerName,
    type: callType, room_id: 'empy-daddy-room', status: 'ringing',
  }).select().single();
  if (error) throw error;
  return data.id;
}

export async function updateCallStatus(callId, status) {
  if (!supabaseReady) return;
  await supabase.from('calls').update({ status }).eq('id', callId);
}

export function subscribeToIncomingCalls(listenForCallerId, callback) {
  if (!supabaseReady) return () => {};
  const channel = supabase.channel(`incoming-calls-${listenForCallerId}`)
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'calls', filter: `caller_id=eq.${listenForCallerId}` },
      (payload) => {
        const call = payload.new;
        if (call.status === 'ringing') callback({ callId: call.id, ...call });
      })
    .subscribe();
  return () => supabase.removeChannel(channel);
}

export function watchCallStatus(callId, callback) {
  if (!supabaseReady || !callId) return () => {};
  const channel = supabase.channel(`call-status-${callId}`)
    .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'calls', filter: `id=eq.${callId}` },
      (payload) => callback(payload.new.status))
    .subscribe();
  return () => supabase.removeChannel(channel);
}

// ─── Web Push (VAPID) ────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export async function registerPushSubscription(userId) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  if (!VAPID_PUBLIC) { console.warn('[Push] VAPID_PUBLIC_KEY not set'); return false; }

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
    });
  }

  const key  = sub.getKey('p256dh');
  const auth = sub.getKey('auth');
  if (!key || !auth) return false;

  const p256dh = btoa(String.fromCharCode(...new Uint8Array(key)));
  const authStr = btoa(String.fromCharCode(...new Uint8Array(auth)));

  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: userId, endpoint: sub.endpoint, p256dh: p256dh, auth: authStr,
  }, { onConflict: 'user_id' });

  return !error;
}

export async function sendPushNotification(targetUserId, title, body, data = {}) {
  if (!EDGE_PUSH_URL || !supabaseReady) return;
  try {
    await fetch(EDGE_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON },
      body: JSON.stringify({ target_user_id: targetUserId, title, body, data }),
    });
  } catch (e) {
    console.warn('[Push] Failed to send notification:', e.message);
  }
}
