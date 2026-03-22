/**
 * Bunny.net — Edge Storage Zone upload + CDN playback
 *
 * All storage API calls go through /api/bunny/ reverse proxy
 * (Vite dev proxy or nginx in production) which adds the AccessKey header.
 * This keeps the storage password server-side only.
 *
 * Playback is direct from the CDN Pull Zone (no auth needed).
 *
 * Required .env.local vars:
 *   VITE_BUNNY_STORAGE_ZONE  — Storage zone name (used by proxy config)
 *   VITE_BUNNY_STORAGE_HOST  — Storage host (used by proxy config)
 *   VITE_BUNNY_MOVIES_CDN    — CDN hostname for video playback
 */

const CDN_HOST   = import.meta.env.VITE_BUNNY_MOVIES_CDN;
const MOVIES_DIR = 'movies';

// ─── URL helpers ────────────────────────────────────────────────────────────

export function getVideoUrl(filename) {
  return `https://${CDN_HOST}/${MOVIES_DIR}/${encodeURIComponent(filename)}`;
}

// ─── List movies from Storage Zone (via proxy) ──────────────────────────────

export async function fetchMovies() {
  try {
    const res = await fetch(`/api/bunny/${MOVIES_DIR}/`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [];
    const files = await res.json();
    const videoExts = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'];
    return files
      .filter(f => !f.IsDirectory && videoExts.some(ext => f.ObjectName.toLowerCase().endsWith(ext)))
      .map(f => ({
        id: f.Guid,
        filename: f.ObjectName,
        title: f.ObjectName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
        size: f.Length,
        addedAt: f.DateCreated,
      }));
  } catch {
    return [];
  }
}

// ─── Upload via PUT (XHR through proxy for progress) ────────────────────────

export async function uploadMovie(file, title, onProgress) {
  const ext = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : '.mp4';
  const safeName = title.trim().replace(/[^a-zA-Z0-9 _-]/g, '').replace(/\s+/g, '_');
  const filename = `${safeName}${ext}`;
  const url = `/api/bunny/${MOVIES_DIR}/${encodeURIComponent(filename)}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url, true);
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.min(99, Math.round((e.loaded / e.total) * 100)));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        if (onProgress) onProgress(100);
        resolve({ filename });
      } else {
        reject(new Error(`Upload failed: HTTP ${xhr.status} — ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.ontimeout = () => reject(new Error('Upload timed out'));
    xhr.timeout = 0;
    xhr.send(file);
  });
}

// ─── Delete from Storage Zone (via proxy) ────────────────────────────────────

export async function deleteMovie(filename) {
  const url = `/api/bunny/${MOVIES_DIR}/${encodeURIComponent(filename)}`;
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Delete failed: HTTP ${res.status}`);
}

// ─── Check if Bunny is configured ─────────────────────────────────────────────

export function isBunnyConfigured() {
  return !!CDN_HOST;
}
