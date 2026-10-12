# Katha Arana (කතා අරණ) — SEO-First Web Novel Platform

An edge-native, distraction-free reading platform for serialized novels and fiction. Built with **Astro**, **Tailwind CSS**, and **Shadcn design tokens**, tailored according to **Impeccable** design principles.

Designed specifically to be deployed on **Cloudflare Pages** with **zero database/admin overhead** and a pure **Git-Push / API publishing workflow**.

---

## 🌟 Key Features

* **⚡ 100/100 Core Web Vitals**: Pre-rendered static HTML via Astro. Zero client-side hydration overhead for novel prose.
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
  https://api.github.com/repos/YOUR_USER/Katha-arana/contents/src/content/chapters/the-shadow-throne/chapter-04.md \
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

## 💻 Local Development

```bash
# Run local development server
npm run dev

# Build production static bundle
npm run build

# Preview production build locally
npm run preview
```
