/**
 * Bunny.net — Video Library (Stream) + Edge Script metadata API
 *
 * Videos are uploaded to Bunny Stream via TUS protocol (resumable, browser-native).
 * Movie metadata (title, id, thumbnail, date) is stored in BunnyDB via an Edge Script.
 *
 * Required .env.local vars:
 *   VITE_BUNNY_LIBRARY_ID      — Bunny Stream Library ID
 *   VITE_BUNNY_STREAM_API_KEY  — Bunny Stream Library API Key
 *   VITE_BUNNY_CDN_HOSTNAME    — e.g. empy-movies.b-cdn.net
 *   VITE_BUNNY_EDGE_API_URL    — e.g. https://api.empy.my/movies
 */

const LIBRARY_ID    = import.meta.env.VITE_BUNNY_LIBRARY_ID;
const STREAM_API_KEY = import.meta.env.VITE_BUNNY_STREAM_API_KEY;
const CDN_HOSTNAME  = import.meta.env.VITE_BUNNY_CDN_HOSTNAME;
const EDGE_API_URL  = import.meta.env.VITE_BUNNY_EDGE_API_URL;
const STREAM_BASE   = 'https://video.bunnycdn.com';
const CHUNK_SIZE    = 50 * 1024 * 1024; // 50 MB per TUS chunk

// ─── URL helpers ────────────────────────────────────────────────────────────

export function getEmbedUrl(videoId) {
  return `https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${videoId}?autoplay=true&responsive=true&preload=true&loop=false`;
}

export function getThumbnailUrl(videoId) {
  return `https://${CDN_HOSTNAME}/${videoId}/thumbnail.jpg`;
}

// ─── Movie Metadata (BunnyDB via Edge Script) ────────────────────────────────

export async function fetchMovies() {
  if (!EDGE_API_URL) return [];
  try {
    const res = await fetch(EDGE_API_URL);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function saveMovieMetadata(metadata) {
  const res = await fetch(EDGE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metadata),
  });
  if (!res.ok) throw new Error('Failed to save movie metadata');
  return res.json();
}

export async function deleteMovieMetadata(videoId) {
  await fetch(`${EDGE_API_URL}/${videoId}`, { method: 'DELETE' });
}

// ─── Upload via TUS (Bunny Stream) ───────────────────────────────────────────

/**
 * Uploads a movie file to Bunny Stream using TUS protocol.
 * @param {File} file         — The video file to upload
 * @param {string} title      — Display title
 * @param {Function} onProgress — (percent: number) => void
 * @returns {string} videoId (GUID)
 */
export async function uploadMovie(file, title, onProgress) {
  // 1. Create video entry in the library
  const createRes = await fetch(`${STREAM_BASE}/library/${LIBRARY_ID}/videos`, {
    method: 'POST',
    headers: {
      AccessKey: STREAM_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });

  if (!createRes.ok) {
    const err = await createRes.text().catch(() => '');
    throw new Error(`Failed to create video entry: ${err}`);
  }

  const { guid } = await createRes.json();

  // 2. Upload file via TUS
  await tusUpload(file, guid, onProgress);

  return guid;
}

// ─── TUS v1.0.0 Implementation ───────────────────────────────────────────────

async function tusUpload(file, videoId, onProgress) {
  const fileSize = file.size;
  const expire   = Math.floor(Date.now() / 1000) + 7200; // 2 hr expiry
  const sig      = await sha256(`${LIBRARY_ID}${STREAM_API_KEY}${expire}${videoId}`);

  // TUS creation: POST to get an upload Location URL
  const createRes = await fetch(`${STREAM_BASE}/tusupload`, {
    method: 'POST',
    headers: {
      'Tus-Resumable':        '1.0.0',
      'Upload-Length':        String(fileSize),
      'Content-Type':         'application/offset+octet-stream',
      'AuthorizationSignature': sig,
      'AuthorizationExpire':  String(expire),
      'VideoId':              videoId,
      'LibraryId':            String(LIBRARY_ID),
    },
  });

  if (createRes.status !== 201 && !createRes.ok) {
    throw new Error(`TUS create failed: ${createRes.status}`);
  }

  const location = createRes.headers.get('Location');
  if (!location) throw new Error('TUS: no Location header returned');

  // Upload file in 50 MB chunks
  let offset = 0;
  while (offset < fileSize) {
    const end   = Math.min(offset + CHUNK_SIZE, fileSize);
    const chunk = file.slice(offset, end);

    const patchRes = await fetch(location, {
      method: 'PATCH',
      headers: {
        'Tus-Resumable':  '1.0.0',
        'Upload-Offset':  String(offset),
        'Content-Type':   'application/offset+octet-stream',
        'Content-Length': String(chunk.size),
      },
      body: chunk,
    });

    if (!patchRes.ok) {
      throw new Error(`TUS chunk upload failed at offset ${offset}: ${patchRes.status}`);
    }

    offset = parseInt(patchRes.headers.get('Upload-Offset') || String(end), 10);
    if (onProgress) onProgress(Math.min(99, Math.round((offset / fileSize) * 100)));
  }

  if (onProgress) onProgress(100);
}

async function sha256(message) {
  const data = new TextEncoder().encode(message);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ─── Delete from library ─────────────────────────────────────────────────────

export async function deleteVideo(videoId) {
  await fetch(`${STREAM_BASE}/library/${LIBRARY_ID}/videos/${videoId}`, {
    method: 'DELETE',
    headers: { AccessKey: STREAM_API_KEY },
  });
  await deleteMovieMetadata(videoId);
}

// ─── Check if Bunny is configured ─────────────────────────────────────────────

export function isBunnyConfigured() {
  return !!(LIBRARY_ID && STREAM_API_KEY && EDGE_API_URL);
}
