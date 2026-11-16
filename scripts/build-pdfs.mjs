// After `astro build`: print every /print/<novel>/ page to /downloads/<novel>.pdf with Chrome,
// then delete /print/ so those pages never go live. Chrome shapes Sinhala text correctly,
// which the JavaScript PDF libraries can't.
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

export default async function buildPdfs(distDir, log = console) {
  const printDir = join(distDir, 'print');
  if (!existsSync(printDir)) return;
  const novels = readdirSync(printDir);
  const executablePath = BROWSERS.find((p) => p && existsSync(p));
  try {
    if (!executablePath) {
      // The live build must have PDFs; a local build without Chrome just skips them.
      if (process.env.CI) throw new Error('No Chrome found for the story PDFs. Set CHROME_PATH.');
      log.warn('No Chrome or Edge found: skipping story PDFs.');
      return;
    }
    const out = join(distDir, 'downloads');
    mkdirSync(out, { recursive: true });
    const server = await serve(normalize(distDir));
    const browser = await puppeteer.launch({ executablePath, args: ['--no-sandbox'] });
    try {
      const page = await browser.newPage();
      for (const id of novels) {
        await page.goto(`http://127.0.0.1:${server.address().port}/print/${id}/`, { waitUntil: 'networkidle0' });
        await page.evaluate(() => document.fonts.ready);
        await page.pdf({ path: join(out, `${id}.pdf`), preferCSSPageSize: true, printBackground: true });
      }
      log.info(`Story PDFs: ${novels.length} written to /downloads/`);
    } finally {
      await browser.close();
      server.close();
    }
  } finally {
    rmSync(printDir, { recursive: true, force: true });
  }
}
