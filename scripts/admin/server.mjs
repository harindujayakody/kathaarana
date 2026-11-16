// Local publishing dashboard: `npm run admin`, then http://localhost:4400.
// Writes the same Markdown files you would write by hand, then commits and pushes them to main;
// GitHub Actions deploys the site. Runs only on this computer and uses your own git login.
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import sharp from 'sharp';
import { bad, genreNames, listStories, planChapter, planStory, readChapter } from './content.mjs';

const run = promisify(execFile);
const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const NOVELS = join(ROOT, 'src/content/novels');
const CHAPTERS = join(ROOT, 'src/content/chapters');
const COVERS = join(ROOT, 'src/assets/covers');
const PAGE = join(dirname(fileURLToPath(import.meta.url)), 'index.html');
const PORT = Number(process.env.ADMIN_PORT) || 4400;
// Only this page may call the API: other websites open in your browser can't read it.
const KEY = randomBytes(24).toString('hex');
const HOSTS = new Set([`localhost:${PORT}`, `127.0.0.1:${PORT}`]);
const ORIGINS = new Set([...HOSTS].map((h) => `http://${h}`));

/* ---------- reading and writing this folder ---------- */

const read = (path) => readFileSync(path, 'utf8');
const mdIn = (dir) => (existsSync(dir) ? readdirSync(dir).filter((f) => /\.mdx?$/.test(f)) : []);

// Everything the shared rules need, read fresh for each request.
function snapshot() {
  const novels = Object.fromEntries(mdIn(NOVELS).map((f) => [f.replace(/\.mdx?$/, ''), read(join(NOVELS, f))]));
  const chapters = {};
  for (const dir of existsSync(CHAPTERS) ? readdirSync(CHAPTERS) : []) {
    chapters[dir] = Object.fromEntries(mdIn(join(CHAPTERS, dir)).map((f) => [f, read(join(CHAPTERS, dir, f))]));
  }
  return { novels, chapters, genresTs: read(join(ROOT, 'src/utils/genres.ts')) };
}

async function coverBytes(dataUrl) {
  const m = /^data:image\/(png|jpe?g|webp|avif);base64,(.+)$/.exec(dataUrl || '');
  if (!m) throw bad('Cover must be a PNG, JPEG, WebP or AVIF image');
  const bytes = await sharp(Buffer.from(m[2], 'base64'))
    .rotate()
    .resize({ width: 1200, withoutEnlargement: true })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
  return { bytes };
}

function writeFiles(files) {
  for (const { path, content } of files) {
    const file = join(ROOT, path);
    mkdirSync(dirname(file), { recursive: true });
    // Keep a text file's line endings (Windows checkouts use CRLF), so an unchanged save isn't a change.
    const crlf = typeof content === 'string' && existsSync(file) && read(file).includes('\r\n');
    writeFileSync(file, crlf ? content.replace(/\n/g, '\r\n') : content);
  }
}

async function saveStory(b) {
  const { slug, files } = await planStory(snapshot(), b, {
    cover: b.cover ? await coverBytes(b.cover) : null,
    coverExists: (name) => existsSync(join(COVERS, name)),
  });
  writeFiles(files);
  return { slug };
}

function saveChapter(b) {
  writeFiles(planChapter(snapshot(), b));
  return { novel: b.novel, chapterNumber: Number(b.chapterNumber) };
}

/* ---------- checking and publishing ---------- */

const CONTENT_PATHS = ['src/content', 'src/assets/covers'];
const git = (...args) => run('git', args, { cwd: ROOT, maxBuffer: 1 << 20 });

async function changes() {
  const branch = (await git('rev-parse', '--abbrev-ref', 'HEAD')).stdout.trim();
  const { stdout } = await git('status', '--porcelain', '-uall', '--', ...CONTENT_PATHS);
  const files = stdout.split('\n').filter(Boolean).map((l) => ({ state: l.slice(0, 2).trim(), path: l.slice(3) }));
  return { branch, files };
}

// `astro sync` loads every content file against the schema, so mistakes show up before pushing.
async function check() {
  try {
    await run(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['astro', 'sync'], { cwd: ROOT, shell: process.platform === 'win32', maxBuffer: 8 << 20 });
    return { ok: true };
  } catch (err) {
    const out = `${err.stdout ?? ''}\n${err.stderr ?? ''}`.replace(/\x1b\[[0-9;]*m/g, '');
    // Keep Astro's explanation (which file, which field) and drop its code locations.
    const lines = out.split('\n').filter((l) => l.trim() && !/^\s+at |node_modules|Error reference|docs\.astro\.build/.test(l));
    const start = Math.max(0, lines.findIndex((l) => /Error/.test(l)));
    return { ok: false, output: lines.slice(start, start + 15).join('\n') || out.slice(-2000) };
  }
}

async function publish(b) {
  const message = text(b.message, 'Commit message');
  const { branch, files } = await changes();
  if (branch !== 'main') throw bad(`Switch to the main branch first (now on ${branch})`);
  if (!files.length) throw bad('Nothing to publish');
  const checked = await check();
  if (!checked.ok) throw Object.assign(new Error(`Check failed, nothing was published:\n${checked.output}`), { status: 400 });

  await git('fetch', '--quiet', 'origin', 'main');
  const behind = Number((await git('rev-list', '--count', 'HEAD..origin/main')).stdout.trim());
  if (behind) await git('merge', '--ff-only', 'origin/main'); // stops with an error if main has diverged

  await git('add', '--all', '--', ...CONTENT_PATHS);
  // Commit only the content folders, even if other files have local changes.
  await git('commit', '--quiet', '-m', message, '--', ...CONTENT_PATHS);
  await git('push', '--quiet', 'origin', 'main');
  const sha = (await git('rev-parse', '--short', 'HEAD')).stdout.trim();
  return { sha, files: files.length };
}

/* ---------- http ---------- */

function readBody(req, limit = 20 << 20) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) {
        reject(bad('Upload too large (20 MB max)'));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch {
        reject(bad('Bad JSON'));
      }
    });
  });
}

const routes = {
  'GET /api/stories': () => {
    const snap = snapshot();
    return { stories: listStories(snap), genres: genreNames(snap) };
  },
  'GET /api/chapter': (_b, url) => readChapter(snapshot(), url.searchParams.get('novel') ?? '', Number(url.searchParams.get('n'))),
  'GET /api/changes': () => changes(),
  'GET /api/cover': (_b, url) => {
    const name = /^[\w.-]+\.(?:png|jpe?g|webp|avif)$/i.exec(url.searchParams.get('name') ?? '')?.[0];
    if (!name || !existsSync(join(COVERS, name))) throw bad('Cover not found');
    return { dataUrl: `data:image/${name.split('.').pop().replace('jpg', 'jpeg')};base64,${readFileSync(join(COVERS, name)).toString('base64')}` };
  },
  'POST /api/story': (b) => saveStory(b),
  'POST /api/chapter': (b) => saveChapter(b),
  'POST /api/check': () => check(),
  'POST /api/publish': (b) => publish(b),
};

const server = createServer(async (req, res) => {
  const send = (status, body, type = 'application/json; charset=utf-8') => {
    res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY' });
    res.end(typeof body === 'string' ? body : JSON.stringify(body));
  };
  // Blocks DNS-rebinding: a page on another domain pointed at 127.0.0.1 still sends its own Host.
  if (!HOSTS.has(req.headers.host)) return send(403, { error: 'Forbidden host' });
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/') {
    const config = { mode: 'local', api: '/api', key: KEY };
    const json = JSON.stringify(config).replace(/</g, '\\u003c');
    return send(200, readFileSync(PAGE, 'utf8').replace('__ADMIN_CONFIG__', () => json), 'text/html; charset=utf-8');
  }
  const route = routes[`${req.method} ${url.pathname}`];
  if (!route) return send(404, { error: 'Not found' });
  if (req.headers['x-admin-key'] !== KEY) return send(403, { error: 'Reload the page' });
  if (req.method === 'POST' && !ORIGINS.has(req.headers.origin)) return send(403, { error: 'Forbidden origin' });
  try {
    const body = req.method === 'POST' ? await readBody(req) : {};
    send(200, await route(body, url));
  } catch (err) {
    send(err.status ?? 500, { error: err.status ? err.message : `${err.message}`.slice(0, 2000) });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  const address = `http://localhost:${PORT}`;
  console.log(`Katha Arana dashboard: ${address}  (Ctrl+C to stop)`);
  if (!process.argv.includes('--no-open')) {
    const opener = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', address]] : [process.platform === 'darwin' ? 'open' : 'xdg-open', [address]];
    execFile(...opener, () => {});
  }
});
