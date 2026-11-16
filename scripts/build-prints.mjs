// After `astro build`, with Chrome:
//   /print/<novel>/      -> /downloads/<novel>.pdf  (the story PDF)
//   /print/card/<novel>/ -> /share/<novel>.jpg      (4:3 card the WhatsApp button attaches)
// then delete /print/ so those pages never go live. Chrome shapes Sinhala text correctly,
// which the JavaScript PDF libraries and sharp's text rendering can't.
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import puppeteer from 'puppeteer-core';

const BROWSERS = [
  process.env.CHROME_PATH,
  '/usr/bin/google-chrome', // GitHub Actions ubuntu runners
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml',
};

// Minimal static server for dist/, so the page's absolute /assets/ links resolve.
function serve(root) {
  const server = createServer((req, res) => {
    let file = normalize(join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
    if (!file.startsWith(root)) return res.writeHead(403).end();
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) return res.writeHead(404).end();
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(readFileSync(file));
  });
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok(server)));
}

export default async function buildPrints(distDir, log = console) {
  const printDir = join(distDir, 'print');
  if (!existsSync(printDir)) return;
  const novels = readdirSync(printDir).filter((d) => d !== 'card');
  const cards = existsSync(join(printDir, 'card')) ? readdirSync(join(printDir, 'card')) : [];
  const executablePath = BROWSERS.find((p) => p && existsSync(p));
  try {
    if (!executablePath) {
      // The live build must have PDFs; a local build without Chrome just skips them.
      if (process.env.CI) throw new Error('No Chrome found for the story PDFs and share cards. Set CHROME_PATH.');
      log.warn('No Chrome or Edge found: skipping story PDFs and share cards.');
      return;
    }
    const out = join(distDir, 'downloads');
    const shareOut = join(distDir, 'share');
    mkdirSync(out, { recursive: true });
    mkdirSync(shareOut, { recursive: true });
    const server = await serve(normalize(distDir));
    const browser = await puppeteer.launch({ executablePath, args: ['--no-sandbox'] });
    try {
      const page = await browser.newPage();
      const open = async (path) => {
        await page.goto(`http://127.0.0.1:${server.address().port}${path}`, { waitUntil: 'networkidle0' });
        await page.evaluate(() => document.fonts.ready);
      };
      for (const id of novels) {
        await open(`/print/${id}/`);
        await page.pdf({ path: join(out, `${id}.pdf`), preferCSSPageSize: true, printBackground: true });
      }
      await page.setViewport({ width: 1200, height: 900 });
      for (const id of cards) {
        await open(`/print/card/${id}/`);
        await page.screenshot({ path: join(shareOut, `${id}.jpg`), type: 'jpeg', quality: 82 });
      }
      log.info(`Story PDFs: ${novels.length} in /downloads/, share cards: ${cards.length} in /share/`);
    } finally {
      await browser.close();
      server.close();
    }
  } finally {
    rmSync(printDir, { recursive: true, force: true });
  }
}
