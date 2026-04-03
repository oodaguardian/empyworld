// Supabase Edge Function — send-push
// Deploy: supabase functions deploy send-push --no-verify-jwt
// Web Push RFC 8291 (aes128gcm) + VAPID (RFC 8292)

// @ts-ignore — Deno ESM import (resolved at runtime by Supabase Edge)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Deno global declarations (this file runs in Deno, not Node)
declare const Deno: {
  env: { get(key: string): string | undefined };
  serve(handler: (req: Request) => Promise<Response>): void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function concatBuffers(...bufs: Uint8Array[]): Uint8Array {
  const total = bufs.reduce((s, b) => s + b.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const b of bufs) { out.set(b, off); off += b.length; }
  return out;
}

function b64url(buf: Uint8Array): string {
  return btoa(String.fromCharCode(...buf)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function b64decode(str: string): Uint8Array {
  return Uint8Array.from(atob(str.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
}

// ── HKDF (RFC 5869) using WebCrypto ─────────────────────────────────────────

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  // Extract: PRK = HMAC-SHA-256(salt, IKM)
  const extractKey = await crypto.subtle.importKey('raw', salt as unknown as BufferSource, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const prk = new Uint8Array(await crypto.subtle.sign('HMAC', extractKey, ikm as unknown as BufferSource));
  // Expand: OKM = HMAC-SHA-256(PRK, info || 0x01)
  const expandKey = await crypto.subtle.importKey('raw', prk as unknown as BufferSource, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const expanded = new Uint8Array(await crypto.subtle.sign('HMAC', expandKey, concatBuffers(info, new Uint8Array([1])) as unknown as BufferSource));
  return expanded.slice(0, length);
}

// ── VAPID JWT (RFC 8292) ────────────────────────────────────────────────────

async function buildVapidAuth(audience: string, subject: string, privKeyB64: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header  = b64url(new TextEncoder().encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const payload = b64url(new TextEncoder().encode(JSON.stringify({ aud: audience, exp: now + 43200, sub: subject })));
  const signing = `${header}.${payload}`;

  const privKey = await crypto.subtle.importKey(
    'pkcs8', b64decode(privKeyB64) as unknown as BufferSource,
    { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']
  );
  const sigDer = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privKey, new TextEncoder().encode(signing)));
  // WebCrypto ECDSA returns raw r||s (64 bytes), which is what VAPID expects
  const sigB64 = b64url(sigDer);

  const vapidPubKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
  return `vapid t=${signing}.${sigB64},k=${vapidPubKey}`;
}

// ── RFC 8291 aes128gcm encryption ───────────────────────────────────────────

async function encryptPayload(payloadStr: string, p256dhB64: string, authB64: string): Promise<Uint8Array> {
  const subscriberPub = b64decode(p256dhB64);
  const authSecret    = b64decode(authB64);

  // Import subscriber public key
  const subscriberPubKey = await crypto.subtle.importKey(
    'raw', subscriberPub as unknown as BufferSource, { name: 'ECDH', namedCurve: 'P-256' }, false, []
  );

  // Generate ephemeral ECDH key pair
  const senderKP = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const senderPubRaw = new Uint8Array(await crypto.subtle.exportKey('raw', senderKP.publicKey));

  // Shared secret via ECDH
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits({ name: 'ECDH', public: subscriberPubKey }, senderKP.privateKey, 256)
  );

  // IKM = HKDF(auth_secret, shared_secret, "WebPush: info\0" || subscriber_pub || sender_pub, 32)
  const ikmInfo = concatBuffers(
    new TextEncoder().encode('WebPush: info\0'),
    subscriberPub,
    senderPubRaw
  );
  const ikm = await hkdf(authSecret, sharedSecret, ikmInfo, 32);

  // Random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // CEK = HKDF(salt, ikm, "Content-Encoding: aes128gcm\0", 16)
  const cek = await hkdf(salt, ikm, new TextEncoder().encode('Content-Encoding: aes128gcm\0'), 16);

  // Nonce = HKDF(salt, ikm, "Content-Encoding: nonce\0", 12)
  const nonce = await hkdf(salt, ikm, new TextEncoder().encode('Content-Encoding: nonce\0'), 12);

  // Plaintext = payload bytes + delimiter 0x02 (final record)
  const plaintext = concatBuffers(new TextEncoder().encode(payloadStr), new Uint8Array([2]));

  // Encrypt with AES-128-GCM
  const aesKey = await crypto.subtle.importKey('raw', cek as unknown as BufferSource, 'AES-GCM', false, ['encrypt']);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce as unknown as BufferSource }, aesKey, plaintext as unknown as BufferSource)
  );

  // Build aes128gcm body: salt(16) || rs(4, uint32 BE) || idlen(1) || keyid(sender pub, 65) || ciphertext
  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, 4096, false);
  return concatBuffers(salt, rs, new Uint8Array([senderPubRaw.length]), senderPubRaw, ciphertext);
}

// ── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { target_user_id, title, body, data } = await req.json();

    // Fetch push subscription for target user
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

    const authorization = await buildVapidAuth(audience, vapidSubject, vapidPrivKey);
    const encryptedBody = await encryptPayload(payload, sub.p256dh, sub.auth);

    const resp = await fetch(sub.endpoint, {
      method: 'POST',
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        TTL: '86400',
      },
      body: encryptedBody as unknown as BodyInit,
    });

    const respText = resp.ok ? '' : await resp.text().catch(() => '');
    return new Response(JSON.stringify({ sent: resp.ok, status: resp.status, detail: respText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ sent: false, reason: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
