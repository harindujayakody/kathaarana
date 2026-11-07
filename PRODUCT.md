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

- Content is Markdown in Git (`src/content/novels`, `src/content/chapters`); publishing is a git push. No admin panel, no database, no accounts.
- Static Astro site on GitHub Pages at kathaarana.com.
- Reader page has 4 themes (light, sepia, dark, AMOLED), font size and font family controls, keyboard chapter navigation, progress bar.
- Bookmarks and reading history are stored in the reader's browser (localStorage).
- RSS feed at `/rss.xml`.

## Capabilities and Constraints

- Routes: home, `/novels`, `/novels/[novel]`, `/novels/[novel]/[chapter]`, `/authors`, `/authors/[author]`, `/genres`, `/genres/[genre]`, `/bookmarks`.
- Novel data: title, optional English title, author, synopsis, cover image (2:3), genres, status (Ongoing/Completed), publish date. Chapters: number, title, date, optional word count.
- Interface language is Sinhala; Sinhala script needs generous line height.
- SEO matters: structured data, sitemap, canonical URLs must keep working.

## Brand Commitments

- Name: Katha Arana / කතා අරණ ("forest of stories").
- Footer credit "Developed by Infiax 360" (infiax.com) stays.
- Owner chose the category-standard look (2026-11-07): clean and conventional, matching the polish of Webnovel/Wattpad (reading-platform patterns) and Medium/Substack (text-first, quiet). No themed costume.

## Evidence on Hand

- Three novels with cover images in `public/images/`; current author names in content are sample data. No reader counts, reviews, or testimonials exist; do not invent any.

## Product Principles

1. Get a cold visitor to the first chapter of a novel with the fewest decisions.
2. Reading comfort beats decoration everywhere.
3. Fresh chapters should be visible at a glance for returning readers.
4. Everything stays free and account-free.
