// Katha Arana API: shared ratings, reactions and view counts for the static site.
// No reader accounts. A random device id (localStorage) gives one vote per device.
// shortcut: device ids can be forged, so a determined person can stuff votes; the per-IP
// rate limit only slows that down. Add Turnstile if rankings ever get abused.

import legacyAssets from './legacy-assets.json';

const REACTIONS = ['like', 'haha', 'wow', 'sad', 'fire'];
const DEVICE_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin');
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim());
  if (!origin || !allowed.includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

// The site publishes { novels: { <id>: [chapterNumbers] } }. Writes for anything else are refused,
// so nobody can fill the database with made-up novel ids.
async function loadCatalog(env) {
  const res = await fetch(env.CATALOG_URL, { cf: { cacheTtl: 300, cacheEverything: true } });
  if (!res.ok) throw new Error(`catalog ${res.status}`);
  return (await res.json()).novels;
}

async function readBody(request) {
  const text = await request.text();
  if (text.length > 1024) return null;
  try {
    const body = JSON.parse(text);
    return body && typeof body === 'object' ? body : null;
  } catch {
    return null;
  }
}

const today = () => new Date().toISOString().slice(0, 10);

async function stats(env) {
  const since = Date.now() - WEEK_MS;
  const [ratings, reactions, views] = await env.DB.batch([
    env.DB.prepare(
      'SELECT novel, AVG(stars) AS avg, COUNT(*) AS n, SUM(updated_at >= ?1) AS week FROM ratings GROUP BY novel',
    ).bind(since),
    env.DB.prepare(
      'SELECT novel, COUNT(*) AS n, SUM(created_at >= ?1) AS week FROM reactions GROUP BY novel',
    ).bind(since),
    env.DB.prepare('SELECT novel, SUM(count) AS n FROM views_daily GROUP BY novel'),
  ]);

  const novels = {};
  const row = (id) => (novels[id] ??= { rating: 0, ratings: 0, likes: 0, views: 0, week: 0 });
  for (const r of ratings.results) {
    Object.assign(row(r.novel), { rating: Math.round(r.avg * 10) / 10, ratings: r.n });
    row(r.novel).week += r.week;
  }
  for (const r of reactions.results) {
    row(r.novel).likes = r.n;
    row(r.novel).week += r.week;
  }
  for (const r of views.results) row(r.novel).views = r.n;
  return { novels };
}

async function reactionCounts(env, novel) {
  const { results } = await env.DB.prepare(
    'SELECT chapter, kind, COUNT(*) AS n FROM reactions WHERE novel = ?1 GROUP BY chapter, kind',
  )
    .bind(novel)
    .all();
  const chapters = {};
  for (const r of results) (chapters[r.chapter] ??= {})[r.kind] = r.n;
  return { chapters };
}

async function handleWrite(path, request, env) {
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim());
  if (!allowed.includes(request.headers.get('Origin'))) return json({ error: 'origin' }, 403);

  const limiter = path === '/api/view' ? env.VIEW_LIMIT : env.WRITE_LIMIT;
  if (limiter) {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const { success } = await limiter.limit({ key: ip });
    if (!success) return json({ error: 'slow down' }, 429);
  }

  const body = await readBody(request);
  if (!body) return json({ error: 'bad body' }, 400);
  const { novel, device } = body;
  if (typeof device !== 'string' || !DEVICE_RE.test(device)) return json({ error: 'device' }, 400);

  let catalog;
  try {
    catalog = await loadCatalog(env);
  } catch {
    return json({ error: 'catalog unavailable' }, 503);
  }
  if (typeof novel !== 'string' || !Object.hasOwn(catalog, novel)) return json({ error: 'novel' }, 400);

  const now = Date.now();

  if (path === '/api/rate') {
    const stars = body.stars;
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) return json({ error: 'stars' }, 400);
    await env.DB.prepare(
      `INSERT INTO ratings (novel, device, stars, updated_at) VALUES (?1, ?2, ?3, ?4)
       ON CONFLICT (novel, device) DO UPDATE SET stars = ?3, updated_at = ?4`,
    )
      .bind(novel, device, stars, now)
      .run();
    return json({ ok: true });
  }

  // chapter 0 means the novel itself
  const chapter = body.chapter ?? 0;
  if (!Number.isInteger(chapter) || (chapter !== 0 && !catalog[novel].includes(chapter))) {
    return json({ error: 'chapter' }, 400);
  }

  if (path === '/api/react') {
    const kind = body.kind;
    if (kind === null) {
      await env.DB.prepare('DELETE FROM reactions WHERE novel = ?1 AND chapter = ?2 AND device = ?3')
        .bind(novel, chapter, device)
        .run();
      return json({ ok: true });
    }
    if (!REACTIONS.includes(kind)) return json({ error: 'kind' }, 400);
    await env.DB.prepare(
      `INSERT INTO reactions (novel, chapter, device, kind, created_at) VALUES (?1, ?2, ?3, ?4, ?5)
       ON CONFLICT (novel, chapter, device) DO UPDATE SET kind = ?4`,
    )
      .bind(novel, chapter, device, kind, now)
      .run();
    return json({ ok: true });
  }

  if (path === '/api/view') {
    if (chapter === 0) return json({ error: 'chapter' }, 400);
    const day = today();
    const logged = await env.DB.prepare(
      'INSERT OR IGNORE INTO view_log (novel, chapter, device, day) VALUES (?1, ?2, ?3, ?4)',
    )
      .bind(novel, chapter, device, day)
      .run();
    if (logged.meta.changes > 0) {
      await env.DB.prepare(
        `INSERT INTO views_daily (novel, day, count) VALUES (?1, ?2, 1)
         ON CONFLICT (novel, day) DO UPDATE SET count = count + 1`,
      )
        .bind(novel, day)
        .run();
    }
    return json({ ok: true });
  }

  return json({ error: 'not found' }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);
    const withCors = (res) => {
      for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
      return res;
    };

    // Built files moved from /_astro/ to /assets/ (2026-11-16). Image names changed with the
    // move, so this fixed list maps every file that ever had an /_astro/ address to its new name.
    if (url.pathname.startsWith('/_astro/')) {
      const target = legacyAssets[url.pathname.slice('/_astro/'.length)];
      if (!target) return new Response('Not found', { status: 404 });
      return new Response(null, {
        status: 301,
        headers: { Location: `/assets/${target}`, 'Cache-Control': 'public, max-age=31536000' },
      });
    }

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    try {
      if (request.method === 'GET' && url.pathname === '/api/stats') {
        return withCors(json(await stats(env), 200, { 'Cache-Control': 'public, max-age=30' }));
      }
      if (request.method === 'GET' && url.pathname === '/api/reactions') {
        const novel = url.searchParams.get('novel') || '';
        if (!/^[a-z0-9-]{1,80}$/.test(novel)) return withCors(json({ error: 'novel' }, 400));
        return withCors(json(await reactionCounts(env, novel), 200, { 'Cache-Control': 'public, max-age=15' }));
      }
      if (request.method === 'POST') return withCors(await handleWrite(url.pathname, request, env));
      return withCors(json({ error: 'not found' }, 404));
    } catch (err) {
      console.error(err);
      return withCors(json({ error: 'server' }, 500));
    }
  },

  // Daily: the dedupe log only matters for the current day.
  async scheduled(_event, env) {
    const cutoff = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await env.DB.prepare('DELETE FROM view_log WHERE day < ?1').bind(cutoff).run();
  },
};
