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

[**Visit the site**](https://kathaarana.com) · [Publish a story](#-publishing) · [Ratings API](#-ratings-likes-and-views-api) · [Local development](#-local-development)

</div>

---

## ✨ Features

**Reading**
- Chapter reader with light, sepia and dark themes, A−/A+ text size, and sans or book (serif) Sinhala fonts. Settings are saved in the browser.
- Reading progress bar, chapter list sheet, bookmarks and reading history. No sign-up.
- Works on any screen size, from 320px phones up.

**Library**
- Novels, short stories (කෙටිකතා), author pages, genre pages and a book shop catalogue (details only, no online ordering yet).
- Star ratings, reactions and view counts shared across readers, with "top novels" rankings.

**SEO and speed**
- Static HTML from Astro: no client framework, self-hosted Noto Sinhala fonts, optimised WebP covers.
- `schema.org` data: `Book`, `Chapter`, `AggregateRating`, `Person`, `BreadcrumbList`, `WebSite`.
- Sitemap with chapter dates, RSS feed, Open Graph share images, web app manifest.

## 🧱 Tech stack

| Part | Tool |
|---|---|
| Site | [Astro 7](https://astro.build) with content collections, Markdown chapters |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) |
| Hosting | GitHub Pages behind Cloudflare (CDN, cache rules) |
| Ratings, reactions, views | Cloudflare Worker + D1 (SQLite), in [`worker/`](worker/) |
| Deploys | GitHub Actions: type check, build, publish on every push to `main`, plus a daily rebuild |

## 📁 Project structure

```text
src/
  content/
    novels/            one Markdown file per novel or short story
    chapters/<novel>/  one Markdown file per chapter (1.md, 2.md, ...)
    books/             book shop entries
  assets/covers/       novel covers (2:3 portrait)
  assets/books/        book covers
  pages/               routes: /novels/, /authors/, /genres/, /books/, /bookmarks/, rss.xml ...
  components/  layouts/  scripts/  styles/  utils/
templates/             starting files for a novel, chapter and book
worker/                Cloudflare Worker for the /api/* endpoints
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

## ⭐ Ratings, likes and views API

A small Cloudflare Worker with a D1 database, served on the same domain at `/api/*`. Readers need no account: a random device id stored in the browser gives one vote per device, and writes are rate-limited per IP.

| Endpoint | What it does |
|---|---|
| `GET /api/stats` | Rating, likes, views and this week's activity for every novel |
| `GET /api/reactions?novel=<id>` | Reaction counts per chapter |
| `POST /api/rate` | `{ novel, stars, device }` |
| `POST /api/react` | `{ novel, chapter, kind, device }` (`chapter: 0` is the novel's like) |
| `POST /api/view` | `{ novel, chapter, device }`, counted once per device per chapter per day |

The Worker only accepts novels and chapters listed in the site's `/catalog.json`.

```bash
# First deploy (once)
cd worker
npx wrangler d1 create kathaarana          # put the printed database_id into wrangler.jsonc
npx wrangler d1 execute kathaarana --remote --file schema.sql
npx wrangler deploy
```

## 💻 Local development

Needs Node.js 22.12 or newer.

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
