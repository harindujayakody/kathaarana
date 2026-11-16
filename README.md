<div align="center">

<a href="https://kathaarana.com">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/assets/logo-white.png">
    <img src="public/brand/logo.png" alt="කතා අරණ (Katha Arana)" width="265">
  </picture>
</a>

### Read Free Sinhala Novels & Short Stories Online

A fast, free Sinhala web-novel library. Read chapter by chapter, no account needed.

[![Deploy](https://github.com/harindujayakody/kathaarana/actions/workflows/deploy.yml/badge.svg)](https://github.com/harindujayakody/kathaarana/actions/workflows/deploy.yml)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Fkathaarana.com&label=kathaarana.com)](https://kathaarana.com)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
<br>
[![Astro](https://img.shields.io/badge/Astro-7-BC52EE?logo=astro&logoColor=white)](https://astro.build)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers_%2B_D1-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)
[![GitHub Pages](https://img.shields.io/badge/hosted_on-GitHub_Pages-222?logo=github)](https://pages.github.com)

[**Visit the site**](https://kathaarana.com) · [Publish a story](#-publishing) · [Ratings API](#-ratings-likes-views-and-downloads-api) · [Local development](#-local-development)

</div>

---

## ✨ Features

**Reading**
- Chapter reader with light, sepia and dark themes (follows the device's dark mode until the reader picks one), A−/A+ text size, and sans or book (serif) Sinhala fonts. Settings are saved in the browser.
- Reading progress bar, chapter list sheet, bookmarks and reading history. No sign-up.
- Instant page changes: links are fetched as they scroll into view, and the next chapter is ready as soon as a chapter opens.
- Works on any screen size, from 320px phones up.

**Download and share**
- A **PDF of every story**, made at build time: the cover, a title page with the source and kathaarana.com credit, every chapter, closing credits, and the author's name watermarked on each page. Download counts are shown on the button. PDFs are kept out of search results (`X-Robots-Tag: noindex`).
- Share buttons for Facebook, WhatsApp and (on phones) Messenger, with no third-party scripts. On phones, WhatsApp sharing attaches a 4:3 story card image.

**Library**
- Novels, short stories (කෙටිකතා), author pages, genre pages and a book shop catalogue (details only, no online ordering yet).
- Star ratings, ❤️/😢 reactions, view and download counts shared across readers, with "top novels" rankings.
- Every story credits its author and links the original source (මුලාශ්‍රය).

**SEO and speed**
- Static HTML from Astro: no client framework, self-hosted Noto Sinhala fonts, optimised WebP covers.
- `schema.org` data: `Book`, `Chapter`, `AggregateRating`, `Person`, `BreadcrumbList`, `WebSite`.
- Sitemap with chapter dates, RSS feed, Open Graph share images, web app manifest, and [`/llms.txt`](https://kathaarana.com/llms.txt) for AI assistants (who runs the site, credits, every story).
- Titles follow `{Title} | Kathaarana.com`.
- Old `/_astro/` image addresses permanently redirect (301) to `/assets/`.

## 🧱 Tech stack

| Part | Tool |
|---|---|
| Site | [Astro 7](https://astro.build) with content collections, Markdown chapters |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) |
| Hosting | GitHub Pages behind Cloudflare (CDN, cache rules) |
| Ratings, reactions, views, downloads | Cloudflare Worker + D1 (SQLite), in [`worker/`](worker/) |
| Story PDFs and share cards | Chrome via `puppeteer-core`, run after the build ([`scripts/build-prints.mjs`](scripts/build-prints.mjs)) |
| Deploys | GitHub Actions: type check, build, publish on every push to `main`, plus a daily rebuild |

## 📁 Project structure

```text
src/
  content/
    novels/            one Markdown file per novel or short story
    chapters/<novel>/  one Markdown file per chapter (01.md, 02.md, ...)
    books/             book shop entries
  assets/covers/       novel covers (2:3 portrait)
  assets/books/        book covers
  pages/               routes: /novels/, /authors/, /genres/, /books/, /bookmarks/, rss.xml, llms.txt ...
  pages/print/         PDF and share-card sources; printed after the build, then removed
  components/  layouts/  scripts/  styles/  utils/
scripts/               build-prints.mjs (PDFs and share cards)
templates/             starting files for a novel, chapter and book
worker/                Cloudflare Worker: /api/*, /_astro/* redirects, /downloads/* noindex
```

## ✍️ Publishing

### Publishing dashboard (easiest)

```bash
npm run admin
```

Opens a page at `http://localhost:4400` on your own computer:

- **නව කතාව (new story):** title, author, source, synopsis, cover (drag and drop), date, genres, and optionally the first chapter. You can also paste a filled template to fill the form.
- **පරිච්ඡේදයක් (add chapter):** pick the story; the next chapter number is filled in. "Each line is a paragraph" fixes text pasted from Facebook.
- **සංස්කරණය (edit):** change any story or chapter.
- **ප්‍රකාශනය (publish):** shows what changed, checks every file against the site's rules, then commits only the story files and covers and pushes to `main`. The site updates a few minutes later.

It only listens on this computer, uses your own git login, and only writes to `src/content/` and `src/assets/covers/`. Publishing needs the `main` branch checked out.

### By hand

No admin panel: a story is a few Markdown files. Copy a template, fill it in and push to `main`. The site rebuilds and goes live in a couple of minutes.

| Template | Copy it to |
|---|---|
| [`templates/novel.md`](templates/novel.md) | `src/content/novels/<novel-slug>.md`, plus a 2:3 cover in `src/assets/covers/` |
| [`templates/chapter.md`](templates/chapter.md) | `src/content/chapters/<novel-slug>/<number>.md` |
| [`templates/book.md`](templates/book.md) | `src/content/books/<book-slug>.md`, plus a cover in `src/assets/books/` |

A novel needs only a title, an author, a source (මුලාශ්‍රය), a short summary, a cover and a date. Genres and a "Completed" status are optional. The file name becomes the web address, so use lowercase English letters, numbers and hyphens. The build stops with a clear message if a required field is missing.

```markdown
---
novel: "my-novel"
chapterNumber: 4
title: "පරිච්ඡේදයේ නම"
publishDate: 2026-11-16
---

Chapter text...
```

## ⭐ Ratings, likes, views and downloads API

A small Cloudflare Worker with a D1 database, served on the same domain at `/api/*`. Readers need no account: a random device id stored in the browser gives one vote per device, and writes are rate-limited per IP.

| Endpoint | What it does |
|---|---|
| `GET /api/stats` | Rating, likes, views and this week's activity for every novel |
| `GET /api/reactions?novel=<id>` | Reaction counts per chapter |
| `POST /api/rate` | `{ novel, stars, device }` |
| `POST /api/react` | `{ novel, chapter, kind, device }` (`chapter: 0` is the novel's like) |
| `POST /api/view` | `{ novel, chapter, device }`, counted once per device per chapter per day |
| `POST /api/download` | `{ novel, device }`, a PDF download, counted once per device per story |

The Worker only accepts novels and chapters listed in the site's `/catalog.json`. Reactions are `like` and `sad`.

The same Worker also serves two other routes: `/_astro/*` answers old image addresses with a 301 to `/assets/` (from [`worker/src/legacy-assets.json`](worker/src/legacy-assets.json)), and `/downloads/*` passes the PDFs through with `X-Robots-Tag: noindex, nofollow`.

```bash
# First deploy (once)
cd worker
npx wrangler d1 create kathaarana          # put the printed database_id into wrangler.jsonc
npx wrangler d1 execute kathaarana --remote --file schema.sql
npx wrangler deploy
```

## 💻 Local development

Needs Node.js 22.12 or newer. The story PDFs and share cards also need Google Chrome or Microsoft Edge installed (found automatically, or set `CHROME_PATH`); without one, a local build skips them. GitHub Actions has Chrome.

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static site in dist/
npm run preview    # serve the build
```

To test against a local API:

```bash
cd worker
npx wrangler d1 execute kathaarana --local --env dev --file schema.sql
npx wrangler dev --env dev --port 8787
# in another terminal, from the project root:
PUBLIC_API_BASE=http://localhost:8787/api npm run build && npm run preview
```

## 📄 License

Code is under the [MIT License](LICENSE). Stories belong to their authors and are credited on every page with a link to the original source.

<div align="center">
<br>
Made with ❤️ by <a href="https://infiax.com">Infiax 360</a>
</div>
