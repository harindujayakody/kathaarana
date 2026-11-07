---
version: 1
slug: "src-pages-index-astro"
primary_target: "src/pages/index.astro"
related_targets: ["src/layouts/BaseLayout.astro"]
---

# Home page

Scope: `/` plus the shared header and footer in BaseLayout. Mode: Read (a reading site's front door).
Audience: search visitors, often on phones, landing cold; returning readers checking new chapters.
Job: pick a novel and start chapter 1, or continue where you stopped.
Constraints: keep SEO head, theme system (light/sepia/dark/AMOLED tokens), bookmarks drawer hooks, Infiax 360 credit.

## Direction contract

THESIS: The category standard, executed cleanly: Webnovel/Wattpad reading-platform patterns with Medium/Substack quiet. Refuses the old dashboard of bordered rounded panels, pills, badges, stat grids and feature lists.
OWN-WORLD: Page ground, no boxed panels; hairline dividers only; one accent (existing theme accent) on the primary button and active states. Noto Serif Sinhala for titles, Noto Sans Sinhala for UI and synopsis. Covers carry the colour.
STORY: The visitor sees one featured novel and can start it in one tap, sees what was published recently, then browses every novel as a cover grid.
FIRST VIEWPORT: Slim header (wordmark left with plain nav beside it (Medium/Substack convention), bookmarks + theme icons right). Optional "continue reading" strip when history exists. Featured novel: 2:3 cover left (~260px), serif title, author, genres as text, synopsis, chapter/status line, primary "කියවීම අරඹන්න" button plus text link to chapter list. Mobile: cover above, button full width.
FORM: canon (category standard), user-chosen; seed: seed:015c28a113df90ba
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
