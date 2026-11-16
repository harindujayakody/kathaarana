// Story rules and file formats shared by the local dashboard (scripts/admin/server.mjs) and the
// online one (worker/src/admin.js), so both write exactly the same Markdown files.
// Both work from a snapshot of the files ({ novels: {slug: text}, chapters: {slug: {file: text}},
// genresTs }) and return the files to write; each side does its own reading and writing.

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const COVER_RE = /^\.\.\/\.\.\/assets\/covers\/([\w.-]+\.(?:png|jpe?g|webp|avif))$/i;
const NOVEL_KEYS = ['title', 'titleEn', 'author', 'authorSlug', 'source', 'synopsis', 'coverImage', 'genres', 'status', 'language', 'publishDate'];
const CHAPTER_KEYS = ['novel', 'chapterNumber', 'title', 'publishDate', 'wordCount', 'source'];

export const bad = (msg) => Object.assign(new Error(msg), { status: 400 });
// Own keys only: a web address like "constructor" must not match a built-in object property.
const has = (obj, key) => Object.hasOwn(obj ?? {}, key);
const text = (v, name, required = true) => {
  const s = typeof v === 'string' ? v.trim() : '';
  if (required && !s) throw bad(`${name} is required`);
  return s;
};

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

export function parseDoc(source) {
  const m = source.replace(/^﻿/, '').match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error('No front matter');
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z]+):\s*(.*)$/);
    if (kv && kv[2] !== '') data[kv[1]] = parseValue(kv[2]);
  }
  return { data, body: m[2].replace(/\r\n/g, '\n').trim() };
}

function buildDoc(data, order, body = '') {
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
  return `---\n${lines.join('\n')}\n---\n${body ? `\n${body}\n` : ''}`;
}

// Pasted stories often put one paragraph per line; the site needs a blank line between paragraphs.
// '<' is written as &lt;: story files are Markdown, which would otherwise run any HTML in pasted
// text (e.g. <script>) on kathaarana.com, the same site the online dashboard lives on.
export function normaliseBody(body, linesAreParagraphs) {
  const t = text(body, 'Chapter text').replace(/\r\n/g, '\n').replace(/</g, '&lt;');
  if (!linesAreParagraphs) return t;
  return t
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n\n');
}

/* ---------- reading a snapshot ---------- */

export function chaptersOf(snap, slug) {
  return Object.entries(has(snap.chapters, slug) ? snap.chapters[slug] : {})
    .filter(([file]) => /\.mdx?$/.test(file))
    .map(([file, source]) => {
      const { data } = parseDoc(source);
      return { file, number: data.chapterNumber, title: data.title, publishDate: data.publishDate };
    })
    .sort((a, b) => a.number - b.number);
}

export function listStories(snap) {
  return Object.entries(snap.novels)
    .map(([slug, source]) => ({ slug, ...parseDoc(source).data, chapters: chaptersOf(snap, slug) }))
    .sort((a, b) => String(b.publishDate).localeCompare(String(a.publishDate)));
}

export function genreNames(snap) {
  const names = [...(snap.genresTs ?? '').matchAll(/name:\s*'([^']+)'/g)].map((m) => m[1]);
  for (const s of listStories(snap)) for (const g of s.genres ?? []) if (!names.includes(g)) names.push(g);
  return names;
}

export function readChapter(snap, slug, number) {
  const c = chaptersOf(snap, slug).find((x) => x.number === number);
  if (!c) throw bad('Chapter not found');
  return parseDoc(snap.chapters[slug][c.file]);
}

export const coverFileName = (path) => COVER_RE.exec(path ?? '')?.[1] ?? null;

/* ---------- planning a save: returns [{ path, content }] (content is text or bytes) ---------- */

// cover: { bytes } from the caller's own image handling (sharp locally, the browser online);
// coverExists(name): whether src/assets/covers/<name> is there.
export async function planStory(snap, b, { cover, coverExists }) {
  const slug = text(b.slug, 'Web address');
  if (!SLUG_RE.test(slug)) throw bad('Web address: lowercase English letters, numbers and hyphens only');
  const exists = has(snap.novels, slug);
  if (b.isNew && exists) throw bad(`A story at /novels/${slug}/ already exists`);
  if (!b.isNew && !exists) throw bad('Story not found');
  const old = exists ? parseDoc(snap.novels[slug]) : { data: {}, body: '' };

  const publishDate = text(b.publishDate, 'Publish date');
  if (!DATE_RE.test(publishDate)) throw bad('Publish date must be YYYY-MM-DD');
  // Ongoing is the default; it is only written if the file already spelled it out.
  const status = b.completed ? 'Completed' : old.data.status ? 'Ongoing' : undefined;
  const genres = Array.isArray(b.genres) ? b.genres.map((g) => String(g).trim()).filter(Boolean) : [];

  const files = [];
  let coverImage = old.data.coverImage;
  if (cover) {
    files.push({ path: `src/assets/covers/${slug}.jpg`, content: cover.bytes });
    coverImage = `../../assets/covers/${slug}.jpg`;
  } else if (b.coverPath) {
    // A cover already in src/assets/covers (e.g. named in a pasted template) can be used as it is.
    const name = coverFileName(b.coverPath);
    if (!name || !(await coverExists(name))) throw bad(`Cover not found in src/assets/covers: ${b.coverPath}`);
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
  files.push({ path: `src/content/novels/${slug}.md`, content: buildDoc(data, NOVEL_KEYS, old.body) });

  if (b.firstChapter?.body?.trim()) {
    // The story doesn't exist in the snapshot yet, so plan its first chapter against a copy that has it.
    const withStory = { ...snap, novels: { ...snap.novels, [slug]: files.at(-1).content } };
    files.push(...planChapter(withStory, { ...b.firstChapter, novel: slug, chapterNumber: 1, publishDate, isNew: true }));
  }
  return { slug, files };
}

export function planChapter(snap, b) {
  const novel = text(b.novel, 'Story');
  if (!SLUG_RE.test(novel) || !has(snap.novels, novel)) throw bad('Story not found');
  const number = Number(b.chapterNumber);
  if (!Number.isInteger(number) || number < 1) throw bad('Chapter number must be 1 or more');
  const publishDate = text(b.publishDate, 'Publish date');
  if (!DATE_RE.test(publishDate)) throw bad('Publish date must be YYYY-MM-DD');

  const existing = chaptersOf(snap, novel).find((c) => c.number === number);
  if (b.isNew && existing) throw bad(`Chapter ${number} already exists`);
  // Keep an existing chapter's file name (older ones are chapter-01.md); new ones are 01.md.
  const name = existing?.file ?? `${String(number).padStart(2, '0')}.md`;
  const old = existing ? parseDoc(snap.chapters[novel][name]).data : {};

  const data = {
    ...old,
    novel,
    chapterNumber: number,
    title: text(b.title, 'Chapter title'),
    publishDate,
    source: text(b.source, 'Source', false) || undefined,
  };
  return [{ path: `src/content/chapters/${novel}/${name}`, content: buildDoc(data, CHAPTER_KEYS, normaliseBody(b.body, b.linesAreParagraphs !== false)) }];
}
