# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Sinhala-speaking readers who mostly arrive from search (Google) looking for Sinhala novels to read online, often on a phone. They land cold on the home page or a novel page and need to see quickly what the site has and start reading.

## Product Purpose

Katha Arana (කතා අරණ) is a free, account-free site for reading serialized Sinhala novels chapter by chapter. Success means a search visitor finds a novel that interests them and starts reading, then comes back for new chapters.

## Positioning

Mostly a home for the owner's own novels, with occasional guest writers, rather than an open multi-author platform. Reading comfort for long Sinhala prose is the core of the product.

## Operating Context

- Content is Markdown in Git (`src/content/novels`, `src/content/chapters`); publishing is a git push. No admin panel and no accounts; the only database holds ratings, reactions and view counts.
- Static Astro site on GitHub Pages at kathaarana.com.
- Reader page has 3 themes (light, sepia, pure-black dark), font size and font family controls, keyboard chapter navigation, progress bar.
- Bookmarks and reading history are stored in the reader's browser (localStorage).
- Ratings (1–5 stars per novel), likes, chapter reactions and view counts are shared across readers through a small Cloudflare Worker + D1 API at `/api/*` (`worker/`). There are still no accounts: a random device id gives one vote per device.
- Home page rankings come from that data: trending (ratings + reactions in the last 7 days), best rated, most liked, most viewed.
- The site behaves like an installed app: sidebar on desktop, bottom tabs on phones, in-app page transitions, web manifest for "add to home screen".
- RSS feed at `/rss.xml`.

## Capabilities and Constraints

- Routes: home, `/novels`, `/novels/[novel]`, `/novels/[novel]/[chapter]`, `/authors`, `/authors/[author]`, `/genres`, `/genres/[genre]`, `/bookmarks`.
- Novel data: title, optional English title, author, synopsis, cover image (2:3), genres, status (Ongoing/Completed), publish date. Chapters: number, title, date, optional word count.
- Interface language is Sinhala; Sinhala script needs generous line height.
- SEO matters: structured data, sitemap, canonical URLs must keep working.

## Brand Commitments

- Name: Katha Arana / කතා අරණ ("forest of stories").
- Footer credit "Developed by Infiax 360" (infiax.com) stays.
- Owner asked for an app-style redesign (2026-11-16) after a community-platform reference: card-based layout, native-app feel, responsive first. Light is the default theme; dark must be pure black with neutral greys, never grey-blue or navy.

## Evidence on Hand

- Three novels with cover images in `src/assets/covers/`; current author names in content are sample data. No reader counts, reviews, or testimonials exist; do not invent any.

## Product Principles

1. Get a cold visitor to the first chapter of a novel with the fewest decisions.
2. Reading comfort beats decoration everywhere.
3. Fresh chapters should be visible at a glance for returning readers.
4. Everything stays free and account-free.
