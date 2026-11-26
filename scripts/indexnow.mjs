// IndexNow: after a deploy, tell Bing and the other IndexNow search engines which pages are new or changed.
// Used by .github/workflows/deploy.yml:
//   node scripts/indexnow.mjs plan <old sitemap URL> <new sitemap file>  -> new/changed page URLs, one per line
//   node scripts/indexnow.mjs send <file of URLs>                        -> submits them to api.indexnow.org
// The key is the name of the public/<key>.txt file, which proves to the engines that the site sent it.
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const HOST = 'kathaarana.com';
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const MAX_URLS = 10000; // IndexNow's limit per request

/** Sitemap XML -> Map of page URL -> lastmod ('' when it has none). */
export function parseSitemap(xml) {
  const pages = new Map();
  for (const [, block] of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1]?.trim();
    if (loc) pages.set(loc, block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1]?.trim() ?? '');
  }
  return pages;
}

/** Pages in the new sitemap that are missing from the old one or have a different date. */
export function changedPages(oldXml, newXml) {
  const before = parseSitemap(oldXml);
  return [...parseSitemap(newXml)].filter(([loc, date]) => before.get(loc) !== date).map(([loc]) => loc);
}

export function siteKey(publicDir = fileURLToPath(new URL('../public/', import.meta.url))) {
  const file = readdirSync(publicDir).find((f) => /^[a-f0-9]{32}\.txt$/.test(f));
  if (!file) throw new Error('No IndexNow key file (public/<32 hex characters>.txt)');
  return file.slice(0, -4);
}

async function plan(oldUrl, newFile) {
  // If the live sitemap can't be read (first run, outage), every page counts as new: harmless, just more URLs.
  const oldXml = await fetch(oldUrl, { headers: { 'Cache-Control': 'no-cache' } })
    .then((r) => (r.ok ? r.text() : ''))
    .catch(() => '');
  console.log(changedPages(oldXml, readFileSync(newFile, 'utf8')).join('\n'));
}

async function send(listFile) {
  const urls = readFileSync(listFile, 'utf8').split('\n').map((s) => s.trim()).filter((u) => u.startsWith(`https://${HOST}/`));
  if (!urls.length) return console.log('IndexNow: no new or changed pages.');
  const key = siteKey();
  for (let i = 0; i < urls.length; i += MAX_URLS) {
    const urlList = urls.slice(i, i + MAX_URLS);
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: HOST, key, keyLocation: `https://${HOST}/${key}.txt`, urlList }),
    });
    // 200 and 202 both mean accepted (202: the key is still being checked).
    console.log(`IndexNow: sent ${urlList.length} page(s), HTTP ${res.status}`);
    if (res.status !== 200 && res.status !== 202) throw new Error(`IndexNow refused: HTTP ${res.status} ${await res.text()}`);
  }
  urls.forEach((u) => console.log(`  ${decodeURI(u)}`));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, a, b] = process.argv.slice(2);
  if (cmd === 'plan' && a && b) await plan(a, b);
  else if (cmd === 'send' && a) await send(a);
  else throw new Error('Usage: indexnow.mjs plan <old sitemap URL> <new sitemap file> | send <file of URLs>');
}
