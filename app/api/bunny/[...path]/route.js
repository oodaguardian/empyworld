/**
 * Next.js Route Handler — Bunny Storage Proxy
 *
 * Proxies /api/bunny/* requests to Bunny Edge Storage,
 * injecting the AccessKey header server-side so the storage
 * password never reaches the browser.
 *
 * Supports: GET (list/download), PUT (upload), DELETE
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  return handleRequest(request, params, 'GET');
}

export async function PUT(request, { params }) {
  return handleRequest(request, params, 'PUT');
}

export async function POST(request, { params }) {
  return handleRequest(request, params, 'POST');
}

export async function DELETE(request, { params }) {
  return handleRequest(request, params, 'DELETE');
}

async function handleRequest(request, params, method) {
  const { path } = await params;
  const bunnyPath = Array.isArray(path) ? path.join('/') : path || '';

  const STORAGE_ZONE = process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE || process.env.VITE_BUNNY_STORAGE_ZONE || 'empy-movies';
  const STORAGE_HOST = process.env.NEXT_PUBLIC_BUNNY_STORAGE_HOST || process.env.VITE_BUNNY_STORAGE_HOST || 'storage.bunnycdn.com';
  const STORAGE_PASS =
    process.env.BUNNY_STORAGE_PASSWORD ||
    process.env.VITE_BUNNY_STORAGE_PASSWORD ||
    '';

  // Bunny Storage requires a trailing slash for directory listing.
  const isDirectoryListing = method === 'GET' && !(/\.[a-zA-Z0-9]{1,5}$/.test(bunnyPath));
  const url = `https://${STORAGE_HOST}/${STORAGE_ZONE}/${bunnyPath}${isDirectoryListing ? '/' : ''}`;

  const headers = {
    AccessKey: STORAGE_PASS,
    Accept: request.headers.get('accept') || 'application/json',
  };

  const contentType = request.headers.get('content-type');
  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  let body = undefined;
  if (method === 'PUT' || method === 'POST') {
    const arrayBuf = await request.arrayBuffer();
    body = Buffer.from(arrayBuf);
    headers['Content-Length'] = String(body.length);
  }

  try {
    const upstream = await fetch(url, {
      method,
      headers,
      body,
    });

    const ct = upstream.headers.get('content-type') || '';

    if (isDirectoryListing) {
      const text = await upstream.text();

      if (!upstream.ok) {
        return Response.json(
          { __error: true, status: upstream.status, detail: text.slice(0, 300) },
          { status: upstream.status, headers: { 'Content-Type': 'application/json' } }
        );
      }

      try {
        return Response.json(JSON.parse(text));
      } catch {
        return Response.json([]);
      }
    } else if (ct.includes('application/json')) {
      const data = await upstream.json();
      return Response.json(data, { status: upstream.status });
    } else {
      const buf = Buffer.from(await upstream.arrayBuffer());
      return new Response(buf, {
        status: upstream.status,
        headers: { 'Content-Type': ct },
      });
    }
  } catch (err) {
    console.error('[bunny-proxy]', err);
    return Response.json(
      { error: 'Upstream request failed', detail: err.message },
      { status: 502 }
    );
  }
}
