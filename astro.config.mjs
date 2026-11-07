import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://kathaarana.com',
  // GitHub Pages serves /x/ and 301s /x, so links and canonicals all use the slash form.
  trailingSlash: 'always',
  // /bookmarks/ is each reader's own localStorage page, not content for search.
  integrations: [sitemap({ filter: (page) => !page.endsWith('/bookmarks/') })],
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
