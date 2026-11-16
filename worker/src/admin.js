// Online publishing dashboard at kathaarana.com/admin/.
// Same screens and rules as `npm run admin` (scripts/admin/), but it reads and writes the repository
// through GitHub's API: every save is one commit on main, and GitHub Actions deploys it.
//
// Who can use it: Cloudflare Access sits in front of /admin* and signs each request; this file checks
// that signature, the app's audience tag and the email itself, and refuses everything until
// ACCESS_TEAM, ACCESS_AUD and ADMIN_EMAILS are set. All four settings, GITHUB_TOKEN included, are
// Worker secrets so the email and token never sit in this public repository.
import page from '../../scripts/admin/index.html';
import { bad, coverFileName, genreNames, listStories, planChapter, planStory, readChapter } from '../../scripts/admin/content.mjs';

const MAX_BODY = 6 * 1024 * 1024; // a resized cover is well under this
const SECURITY_HEADERS = {
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'same-origin',
  'Content-Security-Policy':
    "default-src 'self'; img-src 'self' data: blob: https://cdn.jsdelivr.net/npm/flag-icons@7.2.3/; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
};

const reply = (body, status = 200, type = 'application/json; charset=utf-8') =>
  new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': type, ...SECURITY_HEADERS },
  });

/* ---------- Cloudflare Access ---------- */

const b64urlBytes = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const b64urlJson = (s) => JSON.parse(new TextDecoder().decode(b64urlBytes(s)));

// Returns the signed-in email, or null. Fails closed: no settings, no entry.
async function signedInEmail(request, env, url) {
  // Local testing only (`wrangler dev --env dev`): never on the real hostname.
  if (env.ADMIN_INSECURE_DEV === '1' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')) return 'dev@localhost';

  const team = (env.ACCESS_TEAM || '').replace(/^https?:\/\//, '').replace(/\.cloudflareaccess\.com\/?$/, '');
  const allowed = (env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (!team || !env.ACCESS_AUD || !allowed.length) return null;

  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  const parts = token?.split('.');
  if (!parts || parts.length !== 3) return null;
  try {
    const [h, p, s] = parts;
    const header = b64urlJson(h);
    const claims = b64urlJson(p);
    if (header.alg !== 'RS256') return null;

    const issuer = `https://${team}.cloudflareaccess.com`;
    const certs = await fetch(`${issuer}/cdn-cgi/access/certs`, { cf: { cacheTtl: 3600, cacheEverything: true } }).then((r) => r.json());
    const jwk = certs.keys?.find((k) => k.kid === header.kid);
    if (!jwk) return null;
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlBytes(s), new TextEncoder().encode(`${h}.${p}`));
    if (!valid) return null;

    const now = Math.floor(Date.now() / 1000);
    const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    const email = String(claims.email || '').toLowerCase();
    if (claims.iss !== issuer || !aud.includes(env.ACCESS_AUD) || !(claims.exp > now) || claims.nbf > now + 60 || !allowed.includes(email)) return null;
    return email;
  } catch {
    return null;
  }
}

/* ---------- GitHub ---------- */

function base64(content) {
  const bytes = typeof content === 'string' ? new TextEncoder().encode(content) : content;
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

async function gql(env, query, variables) {
  if (!env.GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is not set (npx wrangler secret put GITHUB_TOKEN)');
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'kathaarana-admin' },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.errors) throw new Error(`GitHub: ${json.errors?.map((e) => e.message).join('; ') || json.message || res.status}`);
  return json.data;
}

const repo = (env) => {
  const [owner, name] = (env.GITHUB_REPO || '').split('/');
  return { owner, name, branch: env.GITHUB_BRANCH || 'main' };
};

// One request for everything the shared rules need: stories, chapters, cover names, genre list.
async function snapshot(env) {
  const { owner, name, branch } = repo(env);
  const data = await gql(
    env,
    `query($owner: String!, $name: String!, $ref: String!, $novels: String!, $chapters: String!, $covers: String!, $genres: String!) {
      repository(owner: $owner, name: $name) {
        ref(qualifiedName: $ref) { target { oid } }
        novels: object(expression: $novels) { ... on Tree { entries { name object { ... on Blob { text } } } } }
        chapters: object(expression: $chapters) { ... on Tree { entries { name object { ... on Tree { entries { name object { ... on Blob { text } } } } } } } }
        covers: object(expression: $covers) { ... on Tree { entries { name } } }
        genres: object(expression: $genres) { ... on Blob { text } }
      }
    }`,
    {
      owner,
      name,
      ref: `refs/heads/${branch}`,
      novels: `${branch}:src/content/novels`,
      chapters: `${branch}:src/content/chapters`,
      covers: `${branch}:src/assets/covers`,
      genres: `${branch}:src/utils/genres.ts`,
    },
  );
  const r = data.repository;
  const md = (entries = []) => entries.filter((e) => /\.mdx?$/.test(e.name) && typeof e.object?.text === 'string');
  return {
    head: r.ref.target.oid,
    novels: Object.fromEntries(md(r.novels?.entries).map((e) => [e.name.replace(/\.mdx?$/, ''), e.object.text])),
    chapters: Object.fromEntries(
      (r.chapters?.entries ?? []).map((dir) => [dir.name, Object.fromEntries(md(dir.object?.entries).map((e) => [e.name, e.object.text]))]),
    ),
    covers: new Set((r.covers?.entries ?? []).map((e) => e.name)),
    genresTs: r.genres?.text ?? '',
  };
}

// All files in one commit. expectedHeadOid makes GitHub refuse if main moved since we read it.
async function commit(env, snap, files, headline) {
  const { branch } = repo(env);
  const data = await gql(
    env,
    `mutation($input: CreateCommitOnBranchInput!) { createCommitOnBranch(input: $input) { commit { oid url } } }`,
    {
      input: {
        branch: { repositoryNameWithOwner: env.GITHUB_REPO, branchName: branch },
        message: { headline },
        expectedHeadOid: snap.head,
        fileChanges: { additions: files.map((f) => ({ path: f.path, contents: base64(f.content) })) },
      },
    },
  );
  const c = data.createCommitOnBranch.commit;
  return { sha: c.oid.slice(0, 7), url: c.url };
}

async function coverPreview(env, name) {
  if (!coverFileName(`../../assets/covers/${name}`)) throw bad('Cover not found');
  const { owner, name: repoName, branch } = repo(env);
  const res = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/src/assets/covers/${encodeURIComponent(name)}?ref=${branch}`, {
    headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: 'application/vnd.github.raw+json', 'User-Agent': 'kathaarana-admin' },
  });
  if (!res.ok) throw bad('Cover not found');
  const ext = name.split('.').pop().toLowerCase().replace('jpg', 'jpeg');
  return { dataUrl: `data:image/${ext};base64,${base64(new Uint8Array(await res.arrayBuffer()))}` };
}

// The browser already resized the cover to a JPEG; check that's what arrived.
function coverFromBrowser(dataUrl) {
  const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl || '');
  if (!m) throw bad('Cover must arrive as a JPEG (reload the page and choose it again)');
  const bytes = Uint8Array.from(atob(m[1]), (c) => c.charCodeAt(0));
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) throw bad('Cover is not a JPEG image');
  return { bytes };
}

/* ---------- stats ---------- */

const ymd = (d) => d.toISOString().slice(0, 10);

// Cloudflare's analytics API. Needs the CF_ANALYTICS_TOKEN secret (Account Analytics: Read).
async function cfQuery(env, query, variables) {
  const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.CF_ANALYTICS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.errors?.length) throw new Error(json.errors?.map((e) => e.message).join('; ') || `HTTP ${res.status}`);
  return json.data;
}

// Web Analytics: real visitors' page loads (the beacon on every page), not bots.
async function webAnalytics(env, since, until) {
  const group = (extra) => `rumPageloadEventsAdaptiveGroups(limit: $limit, filter: { date_geq: $since, date_leq: $until, requestHost: $host }${extra}) `;
  const query = `query($acct: String!, $since: Date!, $until: Date!, $host: String!, $limit: Int!) {
    viewer { accounts(filter: { accountTag: $acct }) {
      daily: ${group(', orderBy: [date_ASC]')}{ count sum { visits } dimensions { date } }
      pages: ${group(', orderBy: [count_DESC]')}{ count dimensions { requestPath } }
      countries: ${group(', orderBy: [count_DESC]')}{ count dimensions { countryName } }
      referrers: ${group(', orderBy: [count_DESC]')}{ count dimensions { refererHost } }
      devices: ${group(', orderBy: [count_DESC]')}{ count dimensions { deviceType } }
    } }
  }`;
  const a = (await cfQuery(env, query, { acct: env.CF_ACCOUNT_ID, since, until, host: env.SITE_HOST, limit: 100 })).viewer.accounts[0] ?? {};
  const top = (rows = [], key, n = 8) => rows.slice(0, n).map((r) => ({ name: r.dimensions[key] || '(direct)', count: r.count }));
  return {
    daily: (a.daily ?? []).map((r) => ({ date: r.dimensions.date, views: r.count, visits: r.sum?.visits ?? 0 })),
    // Only the home page, story pages and chapters; bookmarks, author pages, assets etc. are left out.
    pages: top((a.pages ?? []).filter((r) => /^\/(novels\/[a-z0-9-]+\/(\d+\/)?)?$/.test(r.dimensions.requestPath)), 'requestPath', 10),
    countries: top(a.countries, 'countryName'),
    referrers: top(a.referrers, 'refererHost'),
    devices: top(a.devices, 'deviceType', 4),
  };
}

// The site's own numbers from D1: reads, likes, ratings and PDF downloads per story.
async function siteNumbers(env, since) {
  const sinceMs = Date.parse(`${since}T00:00:00Z`);
  const [views, ratings, reactions, downloads, daily] = await env.DB.batch([
    env.DB.prepare('SELECT novel, SUM(count) AS total, SUM(CASE WHEN day >= ?1 THEN count ELSE 0 END) AS recent FROM views_daily GROUP BY novel').bind(since),
    env.DB.prepare('SELECT novel, AVG(stars) AS avg, COUNT(*) AS n FROM ratings GROUP BY novel'),
    env.DB.prepare("SELECT novel, SUM(kind = 'like') AS likes, SUM(kind = 'sad') AS sad, COUNT(*) AS total FROM reactions GROUP BY novel"),
    env.DB.prepare('SELECT novel, COUNT(*) AS total, SUM(created_at >= ?1) AS recent FROM downloads GROUP BY novel').bind(sinceMs),
    env.DB.prepare('SELECT day, SUM(count) AS reads FROM views_daily WHERE day >= ?1 GROUP BY day ORDER BY day').bind(since),
  ]);
  const novels = {};
  const row = (id) => (novels[id] ??= { reads: 0, readsRecent: 0, rating: 0, ratings: 0, likes: 0, sad: 0, reactions: 0, downloads: 0, downloadsRecent: 0 });
  for (const r of views.results) Object.assign(row(r.novel), { reads: r.total, readsRecent: r.recent });
  for (const r of ratings.results) Object.assign(row(r.novel), { rating: Math.round(r.avg * 10) / 10, ratings: r.n });
  for (const r of reactions.results) Object.assign(row(r.novel), { likes: r.likes, sad: r.sad, reactions: r.total });
  for (const r of downloads.results) Object.assign(row(r.novel), { downloads: r.total, downloadsRecent: r.recent });
  return { novels, daily: daily.results.map((r) => ({ date: r.day, reads: r.reads })) };
}

async function stats(env, days) {
  const until = new Date();
  const since = new Date(until.getTime() - (days - 1) * 86400000);
  const range = { since: ymd(since), until: ymd(until), days };
  const ready = Boolean(env.CF_ANALYTICS_TOKEN && env.CF_ACCOUNT_ID && env.SITE_HOST);
  // Loaded separately, so if Cloudflare fails the site's own numbers still show.
  const [web, site] = await Promise.allSettled([
    ready ? webAnalytics(env, range.since, range.until) : Promise.reject(new Error('not set up')),
    siteNumbers(env, range.since),
  ]);
  const part = (r) => (r.status === 'fulfilled' ? { ok: true, data: r.value } : { ok: false, error: String(r.reason?.message || r.reason).slice(0, 300) });
  return { range, cloudflare: ready, web: part(web), site: part(site) };
}

/* ---------- routes ---------- */

export async function handleAdmin(request, env) {
  const url = new URL(request.url);
  const email = await signedInEmail(request, env, url);
  if (!email) return reply('Not signed in. Open kathaarana.com/admin/ and sign in with your email.', 403, 'text/plain; charset=utf-8');

  if (url.pathname === '/admin') return Response.redirect(new URL('/admin/', url), 302);
  if (request.method === 'GET' && url.pathname === '/admin/') {
    const config = { mode: 'online', api: '/admin/api', key: '', user: email };
    // '<' escaped so nothing in the settings (the email) can close the <script> it sits in.
    const json = JSON.stringify(config).replace(/</g, '\\u003c');
    return reply(page.replace('__ADMIN_CONFIG__', () => json), 200, 'text/html; charset=utf-8');
  }

  // Cloudflare Access sends its cookie with any request, even one started by another website,
  // so writes must come from this page: same origin, JSON body (which forces a CORS preflight we never answer).
  if (request.method === 'POST') {
    if (request.headers.get('Origin') !== url.origin) return reply({ error: 'Forbidden origin' }, 403);
    if (!request.headers.get('Content-Type')?.startsWith('application/json')) return reply({ error: 'JSON only' }, 415);
  }

  try {
    const route = `${request.method} ${url.pathname}`;
    if (route === 'GET /admin/api/stories') {
      const snap = await snapshot(env);
      return reply({ stories: listStories(snap), genres: genreNames(snap) });
    }
    if (route === 'GET /admin/api/chapter') {
      return reply(readChapter(await snapshot(env), url.searchParams.get('novel') ?? '', Number(url.searchParams.get('n'))));
    }
    if (route === 'GET /admin/api/cover') return reply(await coverPreview(env, url.searchParams.get('name') ?? ''));
    if (route === 'GET /admin/api/stats') return reply(await stats(env, url.searchParams.get('days') === '30' ? 30 : 7));

    if (request.method === 'POST' && (url.pathname === '/admin/api/story' || url.pathname === '/admin/api/chapter')) {
      const raw = await request.text();
      if (raw.length > MAX_BODY) throw bad('Upload too large');
      const b = JSON.parse(raw);
      const snap = await snapshot(env);
      if (url.pathname === '/admin/api/story') {
        const { files } = await planStory(snap, b, {
          cover: b.cover ? coverFromBrowser(b.cover) : null,
          coverExists: (name) => snap.covers.has(name),
        });
        return reply(await commit(env, snap, files, `${b.isNew ? 'Publish' : 'Update'} ${String(b.title).trim()}`));
      }
      const files = planChapter(snap, b);
      const story = listStories(snap).find((s) => s.slug === b.novel);
      return reply(await commit(env, snap, files, `${b.isNew ? 'Publish' : 'Update'} ${story?.title ?? b.novel} part ${Number(b.chapterNumber)}`));
    }
    return reply({ error: 'Not found' }, 404);
  } catch (err) {
    console.error(err);
    return reply({ error: err.status ? err.message : String(err.message || err).slice(0, 500) }, err.status ?? 502);
  }
}
