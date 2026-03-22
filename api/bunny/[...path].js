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

  const url = `https://${STORAGE_HOST}/${STORAGE_ZONE}/${bunnyPath}`;

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
  }

  try {
    const upstream = await fetch(url, {
      method: req.method,
      headers,
      body,
    });

    const ct = upstream.headers.get('content-type') || '';
    res.status(upstream.status);
    res.setHeader('Content-Type', ct);

    if (ct.includes('application/json')) {
      const data = await upstream.json();
      res.json(data);
    } else {
      const buf = Buffer.from(await upstream.arrayBuffer());
      res.send(buf);
    }
  } catch (err) {
    console.error('[bunny-proxy]', err);
    res.status(502).json({ error: 'Upstream request failed' });
  }
}
