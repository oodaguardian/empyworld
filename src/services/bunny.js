/**
 * Bunny.net — Edge Storage Zone direct upload + CDN playback
 *
 * Movies are uploaded directly to Bunny Edge Storage via PUT.
 * File listing comes from the Storage Zone API.
 * Playback via CDN Pull Zone linked to the storage zone.
 *
 * Required .env.local vars:
 *   VITE_BUNNY_STORAGE_ZONE      — Storage zone name (e.g. empy-movies)
 *   VITE_BUNNY_STORAGE_HOST      — Storage host (e.g. storage.bunnycdn.com)
 *   VITE_BUNNY_STORAGE_PASSWORD  — Storage zone password (write access)
 *   VITE_BUNNY_MOVIES_CDN        — CDN hostname (e.g. empy-movies-cdn.b-cdn.net)
 */

const STORAGE_ZONE = import.meta.env.VITE_BUNNY_STORAGE_ZONE;
const STORAGE_HOST = import.meta.env.VITE_BUNNY_STORAGE_HOST;
const STORAGE_PASS = import.meta.env.VITE_BUNNY_STORAGE_PASSWORD;
const CDN_HOST     = import.meta.env.VITE_BUNNY_MOVIES_CDN;
const MOVIES_DIR   = 'movies';

// ─── URL helpers ────────────────────────────────────────────────────────────

export function getVideoUrl(filename) {
  return `https://${CDN_HOST}/${MOVIES_DIR}/${encodeURIComponent(filename)}`;
}

// ─── List movies from Storage Zone ──────────────────────────────────────────

export async function fetchMovies() {
  if (!STORAGE_ZONE || !STORAGE_PASS) return [];
  try {
    const res = await fetch(
      `https://${STORAGE_HOST}/${STORAGE_ZONE}/${MOVIES_DIR}/`,
      { headers: { AccessKey: STORAGE_PASS, Accept: 'application/json' } }
    );
    if (!res.ok) return [];
    const files = await res.json();
    // Filter to video files and map to movie objects
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

// ─── Upload via PUT to Storage Zone (XHR for progress) ──────────────────────

/**
 * Uploads a movie file directly to Bunny Edge Storage Zone.
 * @param {File} file         — The video file to upload
 * @param {string} title      — Display title (used as filename)
 * @param {Function} onProgress — (percent: number) => void
 * @returns {{ filename: string }} — The stored filename
 */
export async function uploadMovie(file, title, onProgress) {
  const ext = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : '.mp4';
  const safeName = title.trim().replace(/[^a-zA-Z0-9 _-]/g, '').replace(/\s+/g, '_');
  const filename = `${safeName}${ext}`;
  const url = `https://${STORAGE_HOST}/${STORAGE_ZONE}/${MOVIES_DIR}/${encodeURIComponent(filename)}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url, true);
    xhr.setRequestHeader('AccessKey', STORAGE_PASS);
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
    xhr.timeout = 0; // no timeout for large files
    xhr.send(file);
  });
}

// ─── Delete from Storage Zone ────────────────────────────────────────────────

export async function deleteMovie(filename) {
  const url = `https://${STORAGE_HOST}/${STORAGE_ZONE}/${MOVIES_DIR}/${encodeURIComponent(filename)}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { AccessKey: STORAGE_PASS },
  });
  if (!res.ok) throw new Error(`Delete failed: HTTP ${res.status}`);
}

// ─── Check if Bunny is configured ─────────────────────────────────────────────

export function isBunnyConfigured() {
  return !!(STORAGE_ZONE && STORAGE_PASS && CDN_HOST);
}
