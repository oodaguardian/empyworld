#!/usr/bin/env node
/**
 * Empy TV � Full Automated Deploy
 * Reads .env.local ? provisions Bunny resources ? updates .env.local ? builds Docker image.
 * Usage: node scripts/provision-bunny.mjs
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ENV_FILE = path.join(ROOT, '.env.local');

// ── Parse / update .env.local ────────────────────────────────────────────────
function parseEnv(filePath) {
  const vars = {};
  try {
    for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq < 0) continue;
      vars[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
    }
  } catch {}
  return vars;
}

function updateEnv(filePath, updates) {
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [key, value] of Object.entries(updates)) {
    const re = new RegExp(`^${key}=.*$`, 'm');
    if (re.test(content)) {
      content = content.replace(re, `${key}=${value}`);
    } else {
      content += `\n${key}=${value}\n`;
    }
  }
  fs.writeFileSync(filePath, content, 'utf8');
}

// ── Bunny REST API ────────────────────────────────────────────────────────────
async function bunny(method, endpoint, body, key) {
  const res = await fetch(`https://api.bunny.net${endpoint}`, {
    method,
    headers: { AccessKey: key, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${endpoint} → HTTP ${res.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🐰  Empy TV — Automated Deploy\n' + '─'.repeat(50));

  const env = parseEnv(ENV_FILE);
  const ACCOUNT_KEY = env['BUNNY_ACCOUNT_API_KEY'];

  if (!ACCOUNT_KEY || ACCOUNT_KEY.includes('YOUR_')) {
    console.error('\n❌  BUNNY_ACCOUNT_API_KEY missing in .env.local');
    process.exit(1);
  }

  let libraryId   = env['VITE_BUNNY_LIBRARY_ID'];
  let streamKey   = env['VITE_BUNNY_STREAM_API_KEY'];
  let cdnHostname = env['VITE_BUNNY_CDN_HOSTNAME'];
  let appCdnHost  = '';

  const alreadyProvisioned = libraryId && !libraryId.includes('YOUR_');

  if (alreadyProvisioned) {
    console.log(`\n✅  Library already provisioned (ID: ${libraryId}) — skipping creation`);
  } else {
    // 1. Create Stream library
    console.log('\n📺  Creating Bunny Stream library "empy-movies"…');
    const library = await bunny('POST', '/videolibrary', { Name: 'empy-movies', ReplicationRegions: [], EnableTokenAuthentication: false }, ACCOUNT_KEY);
    libraryId   = String(library.Id);
    streamKey   = library.ApiKey;
    const pz    = await bunny('GET', `/pullzone/${library.PullZoneId}`, null, ACCOUNT_KEY);
    cdnHostname = pz.Hostnames?.find(h => h.IsSystemHostname)?.Value ?? 'empy-movies.b-cdn.net';
    console.log(`    ✓ Library ID: ${libraryId} | CDN: ${cdnHostname}`);

    // 2. Create app Pull Zone
    console.log('\n🌐  Creating app pull zone "empy-app"…');
    const appZone = await bunny('POST', '/pullzone', { Name: 'empy-app', OriginUrl: 'http://placeholder.example.com', EnableSmartCache: true, DisableCookies: true }, ACCOUNT_KEY);
    appCdnHost = appZone.Hostnames?.find(h => h.IsSystemHostname)?.Value ?? 'empy-app.b-cdn.net';
    const appPzId = appZone.Id;
    console.log(`    ✓ Pull Zone ${appPzId} | CDN: ${appCdnHost}`);

    // 3. Custom hostnames
    console.log('\n🔗  Adding custom hostnames empy.my + mvx.empy.my…');
    await bunny('POST', `/pullzone/${appPzId}/addHostname`, { Hostname: 'empy.my' }, ACCOUNT_KEY).catch(e => console.log(`    ⚠ empy.my: ${e.message}`));
    await bunny('POST', `/pullzone/${appPzId}/addHostname`, { Hostname: 'mvx.empy.my' }, ACCOUNT_KEY).catch(e => console.log(`    ⚠ mvx.empy.my: ${e.message}`));
    console.log('    ✓ Done');

    // 4. DNS
    console.log('\n🌍  Configuring DNS for empy.my…');
    const zones = await bunny('GET', '/dnszone', null, ACCOUNT_KEY);
    const zone  = (zones?.Items || []).find(z => z.Domain === 'empy.my');
    if (zone) {
      for (const [name, val] of [['', appCdnHost], ['mvx', appCdnHost], ['cdn', cdnHostname]]) {
        await bunny('PUT', `/dnszone/${zone.Id}/records`, { Type: 2, Name: name, Value: val, Ttl: 300 }, ACCOUNT_KEY)
          .catch(e => console.log(`    ⚠ DNS ${name || '@'}: ${e.message}`));
        console.log(`    ✓ CNAME ${name || '@'} → ${val}`);
      }
      updateEnv(ENV_FILE, { VITE_BUNNY_DNS_ZONE_ID: String(zone.Id) });
    } else {
      console.log('    ⚠ DNS zone "empy.my" not found. Add it manually at dash.bunny.net/dns');
    }

    // 5. Persist to .env.local
    console.log('\n💾  Saving credentials to .env.local…');
    updateEnv(ENV_FILE, {
      VITE_BUNNY_LIBRARY_ID:     libraryId,
      VITE_BUNNY_STREAM_API_KEY: streamKey,
      VITE_BUNNY_CDN_HOSTNAME:   cdnHostname,
    });
    console.log('    ✓ .env.local updated with real Bunny credentials');
  }

  // 6. Docker build
  console.log('\n🐳  Building Docker image: empytv/app:latest…');
  const fresh = parseEnv(ENV_FILE);
  const buildArgs = [
    `VITE_YOUTUBE_API_KEY=${fresh['VITE_YOUTUBE_API_KEY'] || ''}`,
    `VITE_BUNNY_LIBRARY_ID=${fresh['VITE_BUNNY_LIBRARY_ID'] || libraryId}`,
    `VITE_BUNNY_STREAM_API_KEY=${fresh['VITE_BUNNY_STREAM_API_KEY'] || streamKey}`,
    `VITE_BUNNY_CDN_HOSTNAME=${fresh['VITE_BUNNY_CDN_HOSTNAME'] || cdnHostname}`,
    `VITE_BUNNY_EDGE_API_URL=${fresh['VITE_BUNNY_EDGE_API_URL'] || 'https://api.empy.my/movies'}`,
  ].map(a => `--build-arg "${a}"`).join(' ');

  try {
    execSync(`docker build ${buildArgs} -t empytv/app:latest "${ROOT}"`, { stdio: 'inherit', cwd: ROOT });
    console.log('\n    ✓ Docker image built: empytv/app:latest');
  } catch {
    console.error('\n    ❌ Docker build failed — is Docker Desktop running?');
    process.exit(1);
  }

  // 7. Summary
  const done = parseEnv(ENV_FILE);
  console.log('\n' + '═'.repeat(56));
  console.log('✅  DONE — Ready for Magic Container');
  console.log('═'.repeat(56));
  console.log(`
┌─ Magic Container (dash.bunny.net → Magic Containers) ─┐
  Image  : empytv/app:latest
  Port   : 80
  Memory : 512 MB  |  CPU: 0.5
  Env vars: none (baked into image)
└────────────────────────────────────────────────────────┘

┌─ Bunny Stream (movies) ───────────────────────────────┐
  Library ID : ${done['VITE_BUNNY_LIBRARY_ID']}
  CDN Host   : ${done['VITE_BUNNY_CDN_HOSTNAME']}
└────────────────────────────────────────────────────────┘

┌─ Remaining 2 manual steps ────────────────────────────┐
  1. Create Magic Container with image empytv/app:latest
     Then update pull zone "empy-app" origin to its hostname
  2. Deploy bunny-edge/movies-api.js as Edge Script
     at route: api.empy.my/movies
└────────────────────────────────────────────────────────┘
`);
}

main().catch(err => {
  console.error('\n❌', err.message);
  process.exit(1);
});