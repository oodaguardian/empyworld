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

const CDN_HOST = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_BUNNY_MOVIES_CDN) || 'empy-movies-cdn.b-cdn.net';
const MOVIES_DIR = 'movies';
const VIDEO_EXTS = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.ogv', '.ts', '.m3u8'];
const TITLE_OVERRIDES_KEY = 'empyMovieTitleOverrides';

function getTitleOverrides() {
  try {
    const raw = localStorage.getItem(TITLE_OVERRIDES_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function setTitleOverrides(next) {
  try {
    localStorage.setItem(TITLE_OVERRIDES_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage write failures so movie playback/upload still works.
  }
}

function normalizePath(path = '') {
  return String(path).replace(/^\/+/, '').replace(/\/+/g, '/');
}

function joinPath(base, name) {
  const b = normalizePath(base);
  const n = normalizePath(name);
  if (!b) return n;
  if (!n) return b;
  return `${b}/${n}`;
}

function toApiUrl(dir = '') {
  const path = normalizePath(dir);
  if (!path) return '/api/bunny/';
  const encoded = path
    .split('/')
    .filter(Boolean)
    .map(encodeURIComponent)
    .join('/');
  return `/api/bunny/${encoded}/`;
}

function extractItems(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  const candidateKeys = [
    'items', 'Items',
    'files', 'Files',
    'data', 'Data',
    'value', 'Value',
    'objects', 'Objects',
    'storageObjects', 'StorageObjects',
    'children', 'Children',
  ];

  for (const key of candidateKeys) {
    if (Array.isArray(payload[key])) return payload[key];
  }

  return [];
}

function getEntryName(entry) {
  return (
    entry?.ObjectName ||
    entry?.FileName ||
    entry?.Name ||
    entry?.name ||
    entry?.Path ||
    entry?.path ||
    ''
  );
}

function isDirectoryEntry(entry) {
  if (typeof entry?.IsDirectory === 'boolean') return entry.IsDirectory;
  if (typeof entry?.isDirectory === 'boolean') return entry.isDirectory;
  if (typeof entry?.Type === 'string') return entry.Type.toLowerCase() === 'directory';
  if (typeof entry?.type === 'string') return entry.type.toLowerCase() === 'directory';
  return false;
}

function looksLikeVideo(path) {
  const lower = String(path || '').toLowerCase();
  return VIDEO_EXTS.some((ext) => lower.endsWith(ext));
}

async function listDirectory(dir = '') {
  const res = await fetch(toApiUrl(dir), {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const ct = (res.headers.get('content-type') || '').toLowerCase();
  if (!ct.includes('application/json')) {
    throw new Error(`Non-JSON response: ${ct || 'unknown content-type'}`);
  }

  const payload = await res.json();
  return extractItems(payload);
}

// ─── URL helpers ────────────────────────────────────────────────────────────

export function getVideoUrl(filename) {
  if (/^https?:\/\//i.test(filename)) return filename;

  const clean = normalizePath(filename);

  // Use the exact storage-relative path we discovered during listing.
  // Some zones store videos in root, others in movies/.
  const path = clean;
  return `https://${CDN_HOST}/${path.split('/').map(encodeURIComponent).join('/')}`;
}

export function getVideoUrlCandidates(filename) {
  if (/^https?:\/\//i.test(filename)) return [filename];

  const clean = normalizePath(filename);
  const candidates = [clean];

  if (clean.startsWith(`${MOVIES_DIR}/`)) {
    candidates.push(clean.slice(`${MOVIES_DIR}/`.length));
  } else {
    candidates.push(`${MOVIES_DIR}/${clean}`);
  }

  const unique = Array.from(new Set(candidates.filter(Boolean)));
  return unique.map((path) => `https://${CDN_HOST}/${path.split('/').map(encodeURIComponent).join('/')}`);
}

export function getVideoProxyUrl(path) {
  const clean = normalizePath(path);
  const encodedPath = clean
    .split('/')
    .filter(Boolean)
    .map(encodeURIComponent)
    .join('/');
  return `/api/bunny/${encodedPath}`;
}

export function getVideoSourceCandidates(filename) {
  if (/^https?:\/\//i.test(filename)) {
    return [{ url: filename, kind: 'cdn' }];
  }

  const clean = normalizePath(filename);
  const pathVariants = clean.startsWith(`${MOVIES_DIR}/`)
    ? [clean, clean.slice(`${MOVIES_DIR}/`.length)]
    : [clean, `${MOVIES_DIR}/${clean}`];

  const uniquePaths = Array.from(new Set(pathVariants.filter(Boolean)));
  const sources = [];

  // CDN first — <video> tags don't enforce CORS, and CDN supports streaming/range requests.
  for (const path of uniquePaths) {
    sources.push({
      url: `https://${CDN_HOST}/${path.split('/').map(encodeURIComponent).join('/')}`,
      kind: 'cdn',
      path,
    });
  }

  // Proxy as fallback (redirects to CDN for file GETs).
  for (const path of uniquePaths) {
    sources.push({
      url: getVideoProxyUrl(path),
      kind: 'proxy',
      path,
    });
  }

  return sources;
}

// ─── List movies from Storage Zone (via proxy) ──────────────────────────────

export async function fetchMovies() {
  const titleOverrides = getTitleOverrides();
  const visitedDirs = new Set();
  const queue = [MOVIES_DIR, ''];
  const moviesByPath = new Map();
  const MAX_DIRS = 25;

  while (queue.length > 0 && visitedDirs.size < MAX_DIRS) {
    const dir = normalizePath(queue.shift() || '');
    if (visitedDirs.has(dir)) continue;
    visitedDirs.add(dir);

    let items = [];
    try {
      items = await listDirectory(dir);
    } catch (err) {
      console.warn(`[fetchMovies] Failed to list ${toApiUrl(dir)}:`, err?.message || err);
      continue;
    }

    for (const entry of items) {
      const entryName = normalizePath(getEntryName(entry));
      if (!entryName) continue;

      const fullPath = joinPath(dir, entryName);

      if (isDirectoryEntry(entry)) {
        if (!visitedDirs.has(fullPath)) queue.push(fullPath);
        continue;
      }

      if (!looksLikeVideo(fullPath)) continue;

      const normalizedFilename = normalizePath(fullPath);
      if (moviesByPath.has(normalizedFilename)) continue;

      const basename = normalizedFilename.split('/').pop() || normalizedFilename;
      moviesByPath.set(normalizedFilename, {
        id: entry?.Guid || entry?.guid || entry?.Id || entry?.id || normalizedFilename,
        filename: normalizedFilename,
        title: titleOverrides[normalizedFilename] || basename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
        size: entry?.Length || entry?.length || entry?.Size || entry?.size || 0,
        addedAt: entry?.DateCreated || entry?.LastChanged || entry?.createdAt || entry?.CreatedAt || null,
      });
    }
  }

  const movies = Array.from(moviesByPath.values()).sort((a, b) => {
    const aTime = a.addedAt ? new Date(a.addedAt).getTime() : 0;
    const bTime = b.addedAt ? new Date(b.addedAt).getTime() : 0;
    return bTime - aTime;
  });

  if (movies.length === 0) {
    console.warn('[fetchMovies] No movies found in Bunny storage');
  } else {
    console.log(`[fetchMovies] Found ${movies.length} movie(s)`);
  }

  return movies;
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
        const fullPath = `${MOVIES_DIR}/${filename}`;
        const overrides = getTitleOverrides();
        overrides[fullPath] = title.trim();
        setTitleOverrides(overrides);
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
  const clean = normalizePath(filename);
  const path = clean.startsWith(`${MOVIES_DIR}/`) ? clean : `${MOVIES_DIR}/${clean}`;
  const encodedPath = path
    .split('/')
    .filter(Boolean)
    .map(encodeURIComponent)
    .join('/');
  const url = `/api/bunny/${encodedPath}`;
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Delete failed: HTTP ${res.status}`);

  const overrides = getTitleOverrides();
  delete overrides[path];
  delete overrides[clean];
  setTitleOverrides(overrides);
}

export async function updateMovieTitle(filename, title) {
  const clean = normalizePath(filename);
  if (!clean) throw new Error('Missing filename');
  const nextTitle = String(title || '').trim();
  if (!nextTitle) throw new Error('Title cannot be empty');

  const key = clean.startsWith(`${MOVIES_DIR}/`) ? clean : `${MOVIES_DIR}/${clean}`;
  const overrides = getTitleOverrides();
  overrides[key] = nextTitle;
  setTitleOverrides(overrides);

  return { filename: key, title: nextTitle };
}

// ─── Check if Bunny is configured ─────────────────────────────────────────────

export function isBunnyConfigured() {
  return true;
}
