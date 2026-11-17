import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import buildPrints from './scripts/build-prints.mjs';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listSlug, slugFromName } from './src/utils/slug.ts';
import { getGenreSlug } from './src/utils/genres.ts';

// Sitemap <lastmod>: chapter publish dates and book "date added" dates, read straight from frontmatter because
// content collections aren't available in the config.
// shortcut: regex frontmatter parsing, fine for the flat `key: value` lines in src/content; switch to a YAML parser if frontmatter gets nested.
function chapterLastmods() {
  const dates = new Map();
  const bump = (path, date) => {
    if (!dates.has(path) || dates.get(path) < date) dates.set(path, date);
  };
  // Resolved from this file, so it works whatever directory the command runs from.
  const dir = fileURLToPath(new URL('./src/content/chapters', import.meta.url));
  for (const file of readdirSync(dir, { recursive: true })) {
    if (!/\.mdx?$/.test(file)) continue;
    const text = readFileSync(join(dir, file), 'utf8');
    const novel = text.match(/^novel:\s*["']?([^"'\r\n]+)/m)?.[1];
    const num = text.match(/^chapterNumber:\s*(\d+)/m)?.[1];
    const date = new Date(text.match(/^publishDate:\s*["']?([^"'\r\n]+)/m)?.[1]);
    if (!novel || !num || isNaN(date)) continue;
    bump(`/novels/${novel}/${num}/`, date);
    bump(`/novels/${novel}/`, date);
    bump('/novels/', date);
    bump('/', date);
  }
  // Story author and genre pages change when one of their stories gets a chapter: they take the story's latest date.
  const novelsDir = fileURLToPath(new URL('./src/content/novels', import.meta.url));
  for (const file of readdirSync(novelsDir)) {
    if (!/\.mdx?$/.test(file)) continue;
    const date = dates.get(`/novels/${file.replace(/\.mdx?$/, '')}/`);
    if (!date) continue;
    const text = readFileSync(join(novelsDir, file), 'utf8');
    const author = text.match(/^authorSlug:\s*["']?([^"'\r\n]+)/m)?.[1] ?? slugFromName(text.match(/^author:\s*"((?:[^"\\]|\\.)*)"/m)?.[1] ?? '');
    if (author) bump(`/authors/${author}/`, date);
    bump('/authors/', date);
    let genres = [];
    try {
      genres = JSON.parse(text.match(/^genres:\s*(\[.*\])/m)?.[1] ?? '[]');
    } catch {}
    for (const g of genres) bump(`/genres/${decodeURIComponent(getGenreSlug(g))}/`, date);
    if (genres.length) bump('/genres/', date);
  }
  // Books: their "date added" dates the book page, the shop, the home page (it lists new books) and the
  // author, publisher and genre lists the book is on, so Google sees when a book is added.
  const books = fileURLToPath(new URL('./src/content/books', import.meta.url));
  for (const file of readdirSync(books)) {
    if (!/\.mdx?$/.test(file)) continue;
    const text = readFileSync(join(books, file), 'utf8');
    const date = new Date(text.match(/^addedDate:\s*["']?([^"'\r\n]+)/m)?.[1]);
    if (isNaN(date)) continue;
    const field = (key) => text.match(new RegExp(`^${key}:\\s*"((?:[^"\\\\]|\\\\.)*)"`, 'm'))?.[1];
    let genres = [];
    try {
      genres = JSON.parse(text.match(/^genres:\s*(\[.*\])/m)?.[1] ?? '[]');
    } catch {}
    bump(`/books/${file.replace(/\.mdx?$/, '')}/`, date);
    bump('/books/', date);
    bump('/', date);
    for (const [kind, names] of [['author', [field('author')]], ['publisher', [field('publisher')]], ['genre', genres]]) {
      for (const name of names) if (name) bump(`/books/${kind}/${listSlug(name)}/`, date);
    }
  }
  return dates;
}
const lastmods = chapterLastmods();

// https://astro.build/config
export default defineConfig({
  site: 'https://kathaarana.com',
  // GitHub Pages serves /x/ and 301s /x, so links and canonicals all use the slash form.
  trailingSlash: 'always',
  // Instant page changes: the client router fetches each link's page as it scrolls into view
  // (phones have no hover). Astro skips this on Save-Data and 2G connections.
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
  // Built images, styles and scripts live under /assets/ (default is /_astro/).
  // The file names keep their content hash, so browsers can cache them for a year.
  // Old /_astro/ links are 301-redirected to /assets/ by the Worker (worker/src/legacy-assets.json).
  build: { assets: 'assets' },
  // Astro's sharp image service, plus the logo watermark on book pictures (src/utils/image-service.mjs).
  image: { service: { entrypoint: './src/utils/image-service.mjs' } },
  // /bookmarks/ is each reader's own localStorage page, not content for search.
  // /print/ pages are the sources for the PDFs and share cards; deleted once those are written.
  integrations: [
    sitemap({
      filter: (page) =>
        !page.endsWith('/bookmarks/') &&
        !page.includes('/print/') &&
        // Old book-list addresses (Sinhala + English in one, e.g. "බිසෝ-ප්‍රකාශන---biso-prakashana") only redirect;
        // new ones are English-only or Sinhala-only (utils/slug.ts listSlug).
        !/\/books\/(author|publisher|genre)\/(?=[^/]*[a-z])(?=[^/]*[඀-෿])[^/]+\/$/.test(decodeURI(page)),
      serialize(item) {
        // Decoded: Sinhala addresses (e.g. /books/author/චන්දන-මෙන්ඩිස්/) are stored as written.
        const date = lastmods.get(decodeURI(new URL(item.url).pathname));
        if (date) item.lastmod = date.toISOString();
        return item;
      },
    }),
    {
      name: 'story-prints',
      hooks: {
        'astro:build:done': ({ dir, logger }) => buildPrints(fileURLToPath(dir), logger),
      },
    },
  ],
  // Self-hosted at build: no render-blocking request to fonts.googleapis.com.
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Noto Sans Sinhala',
      cssVariable: '--font-si-sans',
      weights: ['400 700'],
      subsets: ['sinhala', 'latin'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Noto Serif Sinhala',
      cssVariable: '--font-si-serif',
      weights: ['400 700'],
      subsets: ['sinhala', 'latin'],
      fallbacks: ['Georgia', 'serif'],
    },
  ],
  vite: {
    plugins: [tailwindcss()]
  }
});
