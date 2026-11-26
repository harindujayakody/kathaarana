// node scripts/indexnow.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { changedPages, parseSitemap, siteKey } from './indexnow.mjs';

const map = (entries) =>
  `<urlset>${entries.map(([loc, date]) => `<url><loc>${loc}</loc>${date ? `<lastmod>${date}</lastmod>` : ''}</url>`).join('')}</urlset>`;
const a = 'https://kathaarana.com/';
const b = 'https://kathaarana.com/books/x/';
const c = 'https://kathaarana.com/books/y/';

assert.deepEqual([...parseSitemap(map([[a, '2026-11-17'], [b, '']]))], [[a, '2026-11-17'], [b, '']]);
// New pages and pages with a new date are sent; unchanged and removed pages are not.
assert.deepEqual(changedPages(map([[a, '2026-11-17'], [b, '2026-11-16']]), map([[a, '2026-11-18'], [b, '2026-11-16'], [c, '2026-11-18']])), [a, c]);
assert.deepEqual(changedPages(map([[a, '2026-11-17']]), map([[a, '2026-11-17']])), []);
// No old sitemap (first run or it couldn't be read): every page.
assert.deepEqual(changedPages('', map([[a, '1'], [b, '']])), [a, b]);
// The key is the name of the committed key file, and the file holds the same key.
assert.match(siteKey(), /^[a-f0-9]{32}$/);
assert.equal(readFileSync(new URL(`../public/${siteKey()}.txt`, import.meta.url), 'utf8').trim(), siteKey());

console.log('indexnow: all checks passed');
