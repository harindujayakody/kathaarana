import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Sitemap <lastmod>: chapter publish dates, read straight from frontmatter because
// content collections aren't available in the config.
// shortcut: regex frontmatter parsing, fine for the flat `key: value` lines in src/content; switch to a YAML parser if frontmatter gets nested.
function chapterLastmods() {
  const dates = new Map();
  const bump = (path, date) => {
    if (!dates.has(path) || dates.get(path) < date) dates.set(path, date);
  };
  const dir = 'src/content/chapters';
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
  return dates;
}
const lastmods = chapterLastmods();

// https://astro.build/config
export default defineConfig({
  site: 'https://kathaarana.com',
  // GitHub Pages serves /x/ and 301s /x, so links and canonicals all use the slash form.
  trailingSlash: 'always',
  // /bookmarks/ is each reader's own localStorage page, not content for search.
  integrations: [
    sitemap({
      filter: (page) => !page.endsWith('/bookmarks/'),
      serialize(item) {
        const date = lastmods.get(new URL(item.url).pathname);
        if (date) item.lastmod = date.toISOString();
        return item;
      },
    }),
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
