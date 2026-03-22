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

const CDN_HOST   = import.meta.env.VITE_BUNNY_MOVIES_CDN || 'empy-movies-cdn.b-cdn.net';
const MOVIES_DIR = 'movies';

// ─── URL helpers ────────────────────────────────────────────────────────────

export function getVideoUrl(filename) {
  // filename may already include the movies/ prefix from fetchMovies
  const path = filename.startsWith(`${MOVIES_DIR}/`) ? filename : `${MOVIES_DIR}/${filename}`;
  return `https://${CDN_HOST}/${path.split('/').map(encodeURIComponent).join('/')}`;
}

// ─── List movies from Storage Zone (via proxy) ──────────────────────────────

export async function fetchMovies() {
  const videoExts = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'];

  const parseFiles = (files, pathPrefix = '') =>
    files
      .filter(f => !f.IsDirectory && videoExts.some(ext => f.ObjectName.toLowerCase().endsWith(ext)))
      .map(f => ({
        id: f.Guid,
        filename: pathPrefix + f.ObjectName,
        title: f.ObjectName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
        size: f.Length,
        addedAt: f.DateCreated,
      }));

  // Try the movies/ subdirectory first, then fall back to storage zone root
  for (const dir of [`${MOVIES_DIR}/`, '']) {
    try {
      const res = await fetch(`/api/bunny/${dir}`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        console.warn(`[fetchMovies] /api/bunny/${dir} → HTTP ${res.status}`);
        continue;
      }
      const ct = (res.headers.get('content-type') || '').toLowerCase();
      if (!ct.includes('application/json')) {
        console.warn(`[fetchMovies] /api/bunny/${dir} returned non-JSON:`, ct);
        continue;
      }
      const items = await res.json();
      const movies = parseFiles(items, dir ? `${MOVIES_DIR}/` : '');
      if (movies.length > 0) {
        console.log(`[fetchMovies] Found ${movies.length} movie(s) in /${dir || '(root)'}`);
        return movies;
      }
    } catch (err) {
      console.error(`[fetchMovies] Error listing /api/bunny/${dir}:`, err);
    }
  }
  console.warn('[fetchMovies] No movies found in any directory');
  return [];
}

// ─── Upload via PUT (XHR through proxy for progress) ────────────────────────

export async function uploadMovie(file, title, onProgress) {
  const ext = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : '.mp4';
  const safeName = title.trim().replace(/[^a-zA-Z0-9 _-]/g, '').replace(/\s+/g, '_') || `movie_${Date.now()}`;
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
        const body = (xhr.responseText || '').slice(0, 300);
        if (body.toLowerCase().includes('<!doctype') || body.toLowerCase().includes('<html')) {
          reject(new Error('Upload endpoint is not active on this deployment. Redeploy the latest container image so /api/bunny proxy is enabled.'));
          return;
        }
        reject(new Error(`Upload failed: HTTP ${xhr.status} — ${body}`));
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
  return true;
}
