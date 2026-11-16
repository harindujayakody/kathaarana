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

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const NOVEL_KEYS = ['title', 'titleEn', 'author', 'authorSlug', 'source', 'synopsis', 'coverImage', 'genres', 'status', 'language', 'publishDate'];
const CHAPTER_KEYS = ['novel', 'chapterNumber', 'title', 'publishDate', 'wordCount', 'source'];

/* ---------- front matter: the flat `key: value` lines these files use ---------- */

function parseValue(raw) {
  const v = raw.trim();
  if (v.startsWith('"')) {
    for (let i = 1; i < v.length; i++) {
      if (v[i] === '\\') i++;
      else if (v[i] === '"') return JSON.parse(v.slice(0, i + 1));
    }
  }
  if (v.startsWith('[')) return JSON.parse(v.slice(0, v.indexOf(']') + 1));
  const bare = v.replace(/\s+#.*$/, '').trim();
  return /^-?\d+$/.test(bare) ? Number(bare) : bare;
}

function parseDoc(text) {
  const m = text.replace(/^﻿/, '').match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error('No front matter');
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z]+):\s*(.*)$/);
    if (kv && kv[2] !== '') data[kv[1]] = parseValue(kv[2]);
  }
  return { data, body: m[2].replace(/\r\n/g, '\n').trim() };
}

function writeDoc(file, data, order, body = '') {
  const keys = [...order.filter((k) => k in data), ...Object.keys(data).filter((k) => !order.includes(k))];
  const lines = keys
    .filter((k) => data[k] !== undefined && data[k] !== null && data[k] !== '')
    .map((k) => {
      const v = data[k];
      if (k === 'publishDate' || typeof v === 'number') return `${k}: ${v}`;
      // JSON strings and arrays are valid YAML; arrays spaced like the hand-written files.
      if (Array.isArray(v)) return `${k}: [${v.map((x) => JSON.stringify(x)).join(', ')}]`;
      return `${k}: ${JSON.stringify(v)}`;
    });
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `---\n${lines.join('\n')}\n---\n${body ? `\n${body}\n` : ''}`);
}

/* ---------- reading ---------- */

const novelFile = (slug) => join(NOVELS, `${slug}.md`);
const chapterFiles = (slug) =>
  existsSync(join(CHAPTERS, slug)) ? readdirSync(join(CHAPTERS, slug)).filter((f) => /\.mdx?$/.test(f)) : [];

function chaptersOf(slug) {
  return chapterFiles(slug)
    .map((file) => {
      const { data } = parseDoc(readFileSync(join(CHAPTERS, slug, file), 'utf8'));
      return { file, number: data.chapterNumber, title: data.title, publishDate: data.publishDate };
    })
    .sort((a, b) => a.number - b.number);
}

function listStories() {
  return readdirSync(NOVELS)
    .filter((f) => /\.mdx?$/.test(f))
    .map((f) => {
      const slug = f.replace(/\.mdx?$/, '');
      const { data } = parseDoc(readFileSync(join(NOVELS, f), 'utf8'));
      return { slug, ...data, chapters: chaptersOf(slug) };
    })
    .sort((a, b) => String(b.publishDate).localeCompare(String(a.publishDate)));
}

function genreNames() {
  const text = readFileSync(join(ROOT, 'src/utils/genres.ts'), 'utf8');
  const names = [...text.matchAll(/name:\s*'([^']+)'/g)].map((m) => m[1]);
  for (const s of listStories()) for (const g of s.genres ?? []) if (!names.includes(g)) names.push(g);
  return names;
}

/* ---------- writing ---------- */

const bad = (msg) => Object.assign(new Error(msg), { status: 400 });
const text = (v, name, required = true) => {
  const s = typeof v === 'string' ? v.trim() : '';
  if (required && !s) throw bad(`${name} is required`);
  return s;
};

// Pasted stories often put one paragraph per line; the site needs a blank line between paragraphs.
function normaliseBody(body, linesAreParagraphs) {
  const t = text(body, 'Chapter text').replace(/\r\n/g, '\n');
  if (!linesAreParagraphs) return t;
  return t
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n\n');
}

async function saveCover(slug, dataUrl) {
  const m = /^data:image\/(png|jpe?g|webp|avif);base64,(.+)$/.exec(dataUrl || '');
  if (!m) throw bad('Cover must be a PNG, JPEG, WebP or AVIF image');
  const out = join(COVERS, `${slug}.jpg`);
  mkdirSync(COVERS, { recursive: true });
  await sharp(Buffer.from(m[2], 'base64'))
    .rotate()
    .resize({ width: 1200, withoutEnlargement: true })
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(out);
  return `../../assets/covers/${slug}.jpg`;
}

async function saveStory(b) {
  const slug = text(b.slug, 'Web address');
  if (!SLUG_RE.test(slug)) throw bad('Web address: lowercase English letters, numbers and hyphens only');
  const file = novelFile(slug);
  const exists = existsSync(file);
  if (b.isNew && exists) throw bad(`A story at /novels/${slug}/ already exists`);
  if (!b.isNew && !exists) throw bad('Story not found');
  const old = exists ? parseDoc(readFileSync(file, 'utf8')) : { data: {}, body: '' };

  const publishDate = text(b.publishDate, 'Publish date');
  if (!DATE_RE.test(publishDate)) throw bad('Publish date must be YYYY-MM-DD');
  // Ongoing is the default; it is only written if the file already spelled it out.
  const status = b.completed ? 'Completed' : old.data.status ? 'Ongoing' : undefined;
  const genres = Array.isArray(b.genres) ? b.genres.map((g) => String(g).trim()).filter(Boolean) : [];

  let coverImage = old.data.coverImage;
  if (b.cover) coverImage = await saveCover(slug, b.cover);
  // A cover already in src/assets/covers (e.g. named in a pasted template) can be used as it is.
  else if (b.coverPath) {
    const name = /^\.\.\/\.\.\/assets\/covers\/([\w.-]+\.(?:png|jpe?g|webp|avif))$/i.exec(b.coverPath)?.[1];
    if (!name || !existsSync(join(COVERS, name))) throw bad(`Cover not found in src/assets/covers: ${b.coverPath}`);
    coverImage = `../../assets/covers/${name}`;
  }
  if (!coverImage) throw bad('A cover image is required');

  const data = {
    ...old.data,
    title: text(b.title, 'Title'),
    author: text(b.author, 'Author'),
    source: text(b.source, 'Source', false) || undefined,
    synopsis: text(b.synopsis, 'Synopsis'),
    coverImage,
    genres: genres.length ? genres : undefined,
    status,
    publishDate,
  };
  if (!status) delete data.status;
  writeDoc(file, data, NOVEL_KEYS, old.body);

  if (b.firstChapter?.body?.trim()) {
    await saveChapter({ ...b.firstChapter, novel: slug, chapterNumber: 1, publishDate, isNew: true });
  }
  return { slug };
}

async function saveChapter(b) {
  const novel = text(b.novel, 'Story');
  if (!SLUG_RE.test(novel) || !existsSync(novelFile(novel))) throw bad('Story not found');
  const number = Number(b.chapterNumber);
  if (!Number.isInteger(number) || number < 1) throw bad('Chapter number must be 1 or more');
  const publishDate = text(b.publishDate, 'Publish date');
  if (!DATE_RE.test(publishDate)) throw bad('Publish date must be YYYY-MM-DD');

  const existing = chaptersOf(novel).find((c) => c.number === number);
  if (b.isNew && existing) throw bad(`Chapter ${number} already exists`);
  // Keep an existing chapter's file name (older ones are chapter-01.md); new ones are 01.md.
  const name = existing?.file ?? `${String(number).padStart(2, '0')}.md`;
  const file = join(CHAPTERS, novel, name);
  const old = existing ? parseDoc(readFileSync(file, 'utf8')).data : {};

  const data = {
    ...old,
    novel,
    chapterNumber: number,
    title: text(b.title, 'Chapter title'),
    publishDate,
    source: text(b.source, 'Source', false) || undefined,
  };
  writeDoc(file, data, CHAPTER_KEYS, normaliseBody(b.body, b.linesAreParagraphs !== false));
  return { novel, chapterNumber: number };
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
  'GET /api/stories': () => ({ stories: listStories(), genres: genreNames() }),
  'GET /api/chapter': (_b, url) => {
    const novel = url.searchParams.get('novel') ?? '';
    const c = chaptersOf(SLUG_RE.test(novel) ? novel : '-').find((x) => x.number === Number(url.searchParams.get('n')));
    if (!c) throw bad('Chapter not found');
    return parseDoc(readFileSync(join(CHAPTERS, novel, c.file), 'utf8'));
  },
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
    return send(200, readFileSync(PAGE, 'utf8').replace('__ADMIN_KEY__', KEY), 'text/html; charset=utf-8');
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

// For the quick self-check: node scripts/admin/server.mjs --self-test
if (process.argv.includes('--self-test')) {
  const doc = parseDoc('---\ntitle: "අ \\"x\\" #1"\ngenres: ["ආ", "ඇ"]\nchapterNumber: 3\npublishDate: 2026-11-16 # note\n---\n\nබ\n');
  console.assert(doc.data.title === 'අ "x" #1' && doc.data.genres[1] === 'ඇ' && doc.data.chapterNumber === 3 && doc.data.publishDate === '2026-11-16' && doc.body === 'බ', 'parseDoc');
  console.assert(normaliseBody('a\n\n b \nc', true) === 'a\n\nb\n\nc', 'normaliseBody');
  console.assert(!SLUG_RE.test('Bad Slug') && SLUG_RE.test('good-slug-2'), 'slug');
  console.log('self-test done');
  server.close();
}
