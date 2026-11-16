# Katha Arana (කතා අරණ) — SEO-First Web Novel Platform

An edge-native, distraction-free reading platform for serialized novels and fiction. Built with **Astro**, **Tailwind CSS**, and **Shadcn design tokens**, tailored according to **Impeccable** design principles.

Designed specifically to be deployed on **Cloudflare Pages** with **zero database/admin overhead** and a pure **Git-Push / API publishing workflow**.

---

## 🌟 Key Features

* **⚡ Static rendering**: Astro pre-renders novel prose as HTML without client-side hydration. Performance scores vary by page and device and are not currently tracked in CI.
* **📱 Immersive Mobile Reader**:
  * **4 Display Themes**: Light (Paper), Warm Sepia (Evening reading), Dark Slate, and pure AMOLED Black (OLED battery saver).
  * **Dynamic Font Scaling**: Real-time `A-` / `A+` font size scaler persisted to `localStorage`.
  * **Typography Toggle**: Switch between Classic Book Serif (*Lora*) and Modern Clean (*Inter*).
  * **Mobile Floating Dock & Table of Contents Drawer**: Jump to any chapter with one tap.
  * **Top Progress Bar**: Subtly indicates reading progress through long chapters.
  * **Keyboard Navigation**: Press `←` (Previous) and `→` (Next) to flip chapters.
* **🔍 SEO First & Structured Data**:
  * Automated **`schema.org/Book`** JSON-LD metadata on novel landing pages.
  * Automated **`schema.org/Chapter`** with `isPartOf` and `position` indexing.
  * Automated **`schema.org/BreadcrumbList`** schemas.
  * Auto-generated **`sitemap-index.xml`** and **`robots.txt`**.
  * Auto-generated **`rss.xml`** feed for reader syndication.

---

## 🚀 Publishing Workflow (No Admin Panel Needed)

### 1. Adding a New Chapter via Git Push

To publish a new chapter, simply create a new Markdown file inside `src/content/chapters/[novel-slug]/`:

Example: `src/content/chapters/the-shadow-throne/chapter-04.md`:

```markdown
---
novel: "the-shadow-throne"
chapterNumber: 4
title: "The Gates of Val-Aran"
publishDate: 2026-10-15
wordCount: 1250
---

The vortex of silver stardust settled upon the valley floor...
```

Then push to your repository:
```bash
git add src/content/chapters/the-shadow-throne/chapter-04.md
git commit -m "feat: Publish Chapter 4"
git push origin main
```
Cloudflare Pages will automatically rebuild and deploy globally in ~20 seconds.

---

### 2. Adding Content via API (Headless / Webhook)

Because your content lives as Markdown in Git, you can push new chapters directly using the **GitHub REST API** without using the command line:

```bash
curl -X PUT \
  -H "Authorization: token YOUR_GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/harindujayakody/kathaarana/contents/src/content/chapters/the-shadow-throne/chapter-04.md \
  -d '{
    "message": "feat: Publish Chapter 4 via API",
    "content": "LS0tCm5vdmVsOiAidGhlLXNoYWRvdy10aHJvbmUiCmNoYXB0ZXJOdW1iZXI6IDQKdGl0bGU6ICJUaGUgR2F0ZXMgb2YgVmFsLUFyYW4iCnB1Ymxpc2hEYXRlOiAyMDI2LTEwLTE1CndvcmRDb3VudDogMTI1MAotLS0KClRoZSB2b3J0ZXggb2Ygc2lsdmVyIHN0YXJkdXN0..."
  }'
```
This commit triggers the automated Cloudflare Pages deployment pipeline.

---

## 🛠️ Deploying to Cloudflare Pages

1. Push this project to GitHub or GitLab.
2. In the [Cloudflare Dashboard](https://dash.cloudflare.com/):
   * Navigate to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
   * Select your repository.
   * Build settings:
     * **Framework preset**: `Astro`
     * **Build command**: `npm run build`
     * **Build output directory**: `dist`
3. Click **Save and Deploy**. Your site will be live at `https://your-project.pages.dev` with free SSL, global CDN edge caching, and automated builds.

---

## ⭐ Ratings, Likes and Views (Cloudflare Worker)

Shared numbers live in a small Cloudflare Worker with a D1 database, in [`worker/`](worker/). The site calls it at `/api/*` on the same domain. Readers need no account: a random device id stored in the browser gives one vote per device.

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

# Local testing: run the API, then build the site against it
npx wrangler d1 execute kathaarana --local --env dev --file schema.sql
npx wrangler dev --env dev --port 8787
PUBLIC_API_BASE=http://localhost:8787/api npm run build && npm run preview
```

---

## 💻 Local Development

```bash
# Run local development server
npm run dev

# Build production static bundle
npm run build

# Preview production build locally
npm run preview
```

