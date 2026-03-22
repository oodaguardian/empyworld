// Supabase Edge Function — send-push
// Deploy: supabase functions deploy send-push
// Triggered by Supabase DB webhook on calls table INSERT,
// or called directly from the client when Empy/Daddy needs to notify the other.
//
// Web Push uses VAPID — no third-party push service needed.
// Generate VAPID keys once: npx web-push generate-vapid-keys
// Set env vars:
//   supabase secrets set VAPID_PUBLIC_KEY=...
//   supabase secrets set VAPID_PRIVATE_KEY=...
//   supabase secrets set VAPID_SUBJECT=mailto:you@empy.my

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Web Push VAPID helper (pure Deno — no npm) ──────────────────────────────
async function importVapidKey(raw: string, usage: KeyUsage[]) {
  const bin = Uint8Array.from(atob(raw.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  return crypto.subtle.importKey('raw', bin, { name: 'ECDH', namedCurve: 'P-256' }, false, usage);
}

async function buildVapidAuthHeader(audience: string, subject: string, privKeyB64: string) {
  const now = Math.floor(Date.now() / 1000);
  const header = btoa(JSON.stringify({ typ: 'JWT', alg: 'ES256' })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payload = btoa(JSON.stringify({ aud: audience, exp: now + 43200, sub: subject })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const signing = `${header}.${payload}`;

  const privBin = Uint8Array.from(atob(privKeyB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  const privKey = await crypto.subtle.importKey(
    'pkcs8', privBin,
    { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privKey, new TextEncoder().encode(signing));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `vapid t=${signing}.${sigB64},k=${Deno.env.get('VAPID_PUBLIC_KEY')}`;
}

// ── Build encrypted Web Push payload ────────────────────────────────────────
async function encryptPayload(payload: string, p256dhB64: string, authB64: string) {
  const p256dh = Uint8Array.from(atob(p256dhB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  const auth   = Uint8Array.from(atob(authB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  const receiverPubKey = await crypto.subtle.importKey('raw', p256dh, { name: 'ECDH', namedCurve: 'P-256' }, false, []);

  const senderKeyPair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey', 'deriveBits']);
  const senderPubRaw  = new Uint8Array(await crypto.subtle.exportKey('raw', senderKeyPair.publicKey));

  const sharedBits = await crypto.subtle.deriveBits({ name: 'ECDH', public: receiverPubKey }, senderKeyPair.privateKey, 256);

  // PRK
  const prkHmacKey = await crypto.subtle.importKey('raw', auth, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const prk = await crypto.subtle.sign('HMAC', prkHmacKey, concatBuffers(new Uint8Array(sharedBits), new TextEncoder().encode('Content-Encoding: auth\0'), new Uint8Array([1])));

  // salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // content encryption key + nonce via HKDF-like expand
  const prkKey = await crypto.subtle.importKey('raw', prk, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const keyInfo = concatBuffers(new TextEncoder().encode('Content-Encoding: aesgcm\0'), p256dh, senderPubRaw, auth, new Uint8Array([1]));
  const nonceInfo = concatBuffers(new TextEncoder().encode('Content-Encoding: nonce\0'), p256dh, senderPubRaw, auth, new Uint8Array([1]));
  const saltKey   = await crypto.subtle.importKey('raw', salt, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const cekHmac   = await crypto.subtle.sign('HMAC', saltKey, keyInfo);
  const nonceHmac = await crypto.subtle.sign('HMAC', saltKey, nonceInfo);
  const cek   = new Uint8Array(cekHmac).slice(0, 16);
  const nonce = new Uint8Array(nonceHmac).slice(0, 12);

  const aesKey = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const paddedPlain = concatBuffers(new Uint8Array(2), new TextEncoder().encode(payload));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aesKey, paddedPlain));

  return { salt, senderPubRaw, ciphertext };
}

function concatBuffers(...bufs: Uint8Array[]) {
  const total = bufs.reduce((s, b) => s + b.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const b of bufs) { out.set(b, off); off += b.length; }
  return out;
}

function b64url(buf: Uint8Array) {
  return btoa(String.fromCharCode(...buf)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

// ── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { target_user_id, title, body, data } = await req.json();

  // Fetch push subscription for the target user
  const { data: sub, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', target_user_id)
    .single();

  if (error || !sub) {
    return new Response(JSON.stringify({ sent: false, reason: 'no subscription' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const payload = JSON.stringify({ title, body, data });
  const vapidPrivKey = Deno.env.get('VAPID_PRIVATE_KEY')!;
  const vapidSubject = Deno.env.get('VAPID_SUBJECT')!;

  const audience = new URL(sub.endpoint).origin;
  const vapidAuth = await buildVapidAuthHeader(audience, vapidSubject, vapidPrivKey);

  let resp: Response;
  try {
    const { salt, senderPubRaw, ciphertext } = await encryptPayload(payload, sub.p256dh, sub.auth);
    resp = await fetch(sub.endpoint, {
      method: 'POST',
      headers: {
        Authorization: vapidAuth,
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aesgcm',
        Encryption: `salt=${b64url(salt)}`,
        'Crypto-Key': `dh=${b64url(senderPubRaw)};` + vapidAuth.replace('vapid ', ''),
        TTL: '86400',
      },
      body: ciphertext,
    });
  } catch (e) {
    return new Response(JSON.stringify({ sent: false, reason: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ sent: resp.ok, status: resp.status }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
