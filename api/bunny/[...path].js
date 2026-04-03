/**
 * Vercel Serverless Function — Bunny Storage Proxy
 *
 * Proxies /api/bunny/* requests to Bunny Edge Storage,
 * injecting the AccessKey header server-side so the storage
 * password never reaches the browser.
 *
 * Supports: GET (list/download), PUT (upload), DELETE
 */

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const pathSegments = req.query.path;
  const bunnyPath = Array.isArray(pathSegments)
    ? pathSegments.join('/')
    : pathSegments || '';

  const STORAGE_ZONE = process.env.VITE_BUNNY_STORAGE_ZONE || 'empy-movies';
  const STORAGE_HOST = process.env.VITE_BUNNY_STORAGE_HOST || 'storage.bunnycdn.com';
  const STORAGE_PASS =
    process.env.BUNNY_STORAGE_PASSWORD ||
    process.env.VITE_BUNNY_STORAGE_PASSWORD ||
    '';

  // Bunny Storage requires a trailing slash for directory listing.
  // Vercel's [...path] routing strips trailing slashes from captured segments,
  // so we restore it: any GET to a path without a file extension is a directory list.
  const isDirectoryListing = req.method === 'GET' && !(/\.[a-zA-Z0-9]{1,5}$/.test(bunnyPath));
  const url = `https://${STORAGE_HOST}/${STORAGE_ZONE}/${bunnyPath}${isDirectoryListing ? '/' : ''}`;

  const headers = {
    AccessKey: STORAGE_PASS,
    Accept: req.headers.accept || 'application/json',
  };
  if (req.headers['content-type']) {
    headers['Content-Type'] = req.headers['content-type'];
  }

  // For PUT/POST, collect the raw body from the incoming request
  let body = undefined;
  if (req.method === 'PUT' || req.method === 'POST') {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    body = Buffer.concat(chunks);
    // Bunny requires explicit Content-Length for reliable streaming uploads
    headers['Content-Length'] = String(body.length);
  }

  try {
    const upstream = await fetch(url, {
      method: req.method,
      headers,
      body,
    });

    const ct = upstream.headers.get('content-type') || '';
    res.status(upstream.status);

    if (isDirectoryListing) {
      // Force application/json for directory listings.
      // Bunny may return text/plain or omit content-type, which breaks the client parser.
      const text = await upstream.text();
      res.setHeader('Content-Type', 'application/json');
      try {
        res.json(JSON.parse(text));
      } catch {
        // Bunny returned non-JSON (empty dir or auth error) — return empty array
        res.json([]);
      }
    } else if (ct.includes('application/json')) {
      res.setHeader('Content-Type', ct);
      res.json(await upstream.json());
    } else {
      const buf = Buffer.from(await upstream.arrayBuffer());
      res.setHeader('Content-Type', ct);
      res.send(buf);
    }
  } catch (err) {
    console.error('[bunny-proxy]', err);
    res.status(502).json({ error: 'Upstream request failed', detail: err.message });
  }
}
