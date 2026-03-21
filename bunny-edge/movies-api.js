/**
 * Bunny Edge Script — Empy TV Movie Metadata API
 * Deploy this at: api.empy.my/movies  (Bunny Edge Scripting)
 *
 * Uses BunnyDB to persist movie metadata (title, bunnyId, addedAt, size).
 *
 * Routes:
 *   GET    /         → returns JSON array of all movies
 *   POST   /         → adds a movie { id, bunnyId, title, addedAt, size }
 *   DELETE /{id}     → removes a movie by id
 *
 * BunnyDB API (available in Bunny Edge Script environment):
 *   BunnyDB.GetValue(dbName, key) → string | null
 *   BunnyDB.SetValue(dbName, key, value) → void
 */

const DB_NAME = 'empy-movies-db';
const DB_KEY  = 'movies';
const ALLOWED_ORIGINS = ['https://empy.my', 'https://mvx.empy.my', 'http://localhost:3000', 'http://localhost:3003'];

bunny.addEventListener('fetch', async (request) => {
  const url    = new URL(request.url);
  const origin = request.headers.get('Origin') || '';

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return corsResponse(null, 204, origin);
  }

  try {
    // GET — return all movies
    if (request.method === 'GET') {
      const raw    = await BunnyDB.GetValue(DB_NAME, DB_KEY);
      const movies = raw ? JSON.parse(raw) : [];
      return corsResponse(movies, 200, origin);
    }

    // POST — add a movie
    if (request.method === 'POST') {
      const movie  = await request.json();
      const raw    = await BunnyDB.GetValue(DB_NAME, DB_KEY);
      const movies = raw ? JSON.parse(raw) : [];

      // Deduplicate by id
      const exists = movies.findIndex(m => m.id === movie.id);
      if (exists >= 0) {
        movies[exists] = { ...movies[exists], ...movie };
      } else {
        movies.unshift({ ...movie, addedAt: movie.addedAt || new Date().toISOString() });
      }

      await BunnyDB.SetValue(DB_NAME, DB_KEY, JSON.stringify(movies));
      return corsResponse({ success: true }, 200, origin);
    }

    // DELETE /{id} — remove a movie
    if (request.method === 'DELETE') {
      const id     = url.pathname.split('/').filter(Boolean).pop();
      const raw    = await BunnyDB.GetValue(DB_NAME, DB_KEY);
      const movies = raw ? JSON.parse(raw) : [];
      const filtered = movies.filter(m => m.id !== id);
      await BunnyDB.SetValue(DB_NAME, DB_KEY, JSON.stringify(filtered));
      return corsResponse({ success: true, removed: movies.length - filtered.length }, 200, origin);
    }

    return new Response('Method Not Allowed', { status: 405 });

  } catch (err) {
    return corsResponse({ error: err.message }, 500, origin);
  }
});

function corsResponse(data, status, origin) {
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
  return new Response(
    data !== null && data !== undefined ? JSON.stringify(data) : undefined,
    { status, headers }
  );
}
