---
name: Katha Arana (කතා අරණ)
description: Free, account-free serialized Sinhala novels, read chapter by chapter.
colors:
  accent: "#0F766E"
  accent-hover: "#115E59"
  accent-text: "#ffffff"
  accent-soft: "rgba(15, 118, 110, 0.12)"
  accent-night: "#2DD4BF"
  accent-night-hover: "#14B8A6"
  accent-night-text: "#042f2e"
  paper: "#fcfbf9"
  ink: "#22252a"
  ink-muted: "#64748b"
  hairline: "#e2e8f0"
  sepia-paper: "#f4ecd8"
  sepia-ink: "#433422"
  sepia-muted: "#796650"
  sepia-hairline: "#ded2b9"
  night-ground: "#0b0f17"
  night-ink: "#e2e8f0"
  night-muted: "#94a3b8"
  night-hairline: "#1e293b"
  amoled-ground: "#000000"
  amoled-ink: "#d4d4d8"
  amoled-muted: "#71717a"
  amoled-hairline: "#18181b"
typography:
  display:
    fontFamily: "Noto Serif Sinhala, Lora, Georgia, serif"
    fontSize: "3rem"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Noto Serif Sinhala, Lora, Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 700
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Noto Serif Sinhala, Lora, Georgia, serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.375
  wordmark:
    fontFamily: "Noto Serif Sinhala, Lora, Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 700
  body:
    fontFamily: "Noto Sans Sinhala, Inter, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
  synopsis:
    fontFamily: "Noto Sans Sinhala, Inter, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.95
  prose:
    fontFamily: "Noto Sans Sinhala, Inter, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 2.15
    letterSpacing: "0.01em"
  label:
    fontFamily: "Noto Sans Sinhala, Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
rounded:
  sm: "4px"
  md: "6px"
  full: "9999px"
spacing:
  gutter: "16px"
  gutter-wide: "24px"
  row: "16px"
  grid-x: "20px"
  grid-y: "32px"
  section: "40px"
  section-wide: "56px"
  footer-gap: "80px"
  container: "64rem"
  header-height: "56px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-text}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  link-quiet:
    textColor: "{colors.ink-muted}"
    typography: "{typography.label}"
  link-quiet-hover:
    textColor: "{colors.ink}"
  icon-button:
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.md}"
    padding: "8px"
  header:
    backgroundColor: "{colors.paper}"
    height: "{spacing.header-height}"
  cover-tile:
    rounded: "{rounded.md}"
  chapter-row:
    padding: "16px 0"
---

# Design System: Katha Arana (කතා අරණ)

## Overview

**Creative North Star: "The Quiet Shelf"**

The category standard, executed cleanly: reading-platform patterns from Webnovel and Wattpad (featured novel, latest chapters, a cover grid) held in the text-first quiet of Medium and Substack. Everything sits directly on the page ground. Structure comes from hairline dividers and whitespace, never from boxes. The interface is near-monochrome so the novel covers can carry all the colour; a single teal accent marks the one action that matters.

Density is calm and editorial: one centred 64rem column, generous vertical rhythm, Sinhala text with tall line heights. The same page must read correctly in four themes (light, sepia, dark, AMOLED), so every surface colour comes from the theme variables, not from fixed values.

**Key Characteristics:**
- Page ground only; no cards, panels, pills or stat grids.
- 1px hairline dividers in the theme border colour separate sections and list rows.
- One accent, on the primary button, hover/active title states, focus rings and the bookmark count.
- Serif (Noto Serif Sinhala) for titles and the wordmark; sans (Noto Sans Sinhala) for UI, synopsis and reading prose.
- Covers at 2:3 are the only colourful objects on the page.

## Colors

A near-monochrome paper-and-ink ground in four themes, with one teal accent that brightens for dark grounds.

### Primary
- **Reading-Room Teal** (accent): the primary "start reading" button, title hover, the continue-reading cue, focus outlines. Hover deepens to accent-hover. On light and sepia grounds the button text is white.
- **Lamplight Teal** (accent-night): the same role in dark and AMOLED themes, with near-black teal text (accent-night-text) on the button.
- **Teal Wash** (accent-soft): soft accent tint, available for selected states; translucent so it adapts to any ground.

### Neutral
- **Paper / Ink / Muted / Hairline** (paper, ink, ink-muted, hairline): light theme ground, body text, secondary metadata (author line, dates, counts, quiet links) and dividers.
- **Sepia set** (sepia-paper, sepia-ink, sepia-muted, sepia-hairline): warm reading theme.
- **Night set** (night-ground, night-ink, night-muted, night-hairline): dark theme.
- **AMOLED set** (amoled-ground, amoled-ink, amoled-muted, amoled-hairline): true-black theme.

In code these resolve through `--reader-bg`, `--reader-text`, `--reader-muted`, `--reader-border` and `--theme-accent*`, switched by `data-theme` on `<html>`. Always reference the variables, never the hex.

### Named Rules
**The Covers Carry Colour Rule.** Chrome stays ink-on-paper. Colour on the page comes from cover art and the single accent; no tinted section backgrounds, coloured badges or gradient fills.

**The One Accent Rule.** The accent appears on at most one filled element per view (the primary button). Everywhere else it is text colour on hover or active, or a focus outline.

## Typography

**Display Font:** Noto Serif Sinhala (with Lora, Georgia)
**Body Font:** Noto Sans Sinhala (with Inter, system-ui)

**Character:** A bookish serif for anything that names a work (novel titles, section heads, the wordmark), paired with a plain sans for everything the reader operates or reads at length. Sinhala script needs height, so line heights run tall.

### Hierarchy
- **Display** (700, 1.875rem mobile / 2.25rem / 3rem desktop, 1.35): the featured novel title on the home page only; text-wrap balance.
- **Headline** (700, 1.5rem): section heads such as latest chapters and all novels.
- **Title** (600, 17px, snug): novel titles in lists, grids and the continue strip; turns accent on hover.
- **Wordmark** (700, 1.25rem header / 1.125rem drawer and footer): the site name, serif.
- **Body** (400, 17px): default UI text.
- **Synopsis** (400, 1.0625rem, 1.95): novel synopsis, max ~38rem measure.
- **Prose** (400, 17px user-adjustable via `--reader-font-size`, 2.15, 0.01em): chapter text; justified on desktop, left-aligned at 16.5px / 2.1 under 640px.
- **Label** (400, 0.875rem, muted): metadata lines, dates (tabular figures), quiet links like "view all" and RSS. Footer legal line drops to 0.75rem.

### Named Rules
**The Serif Names Things Rule.** Serif is for titles of works and section heads; never for buttons, nav or metadata.

## Layout

A single centred column, max 64rem, with 16px gutters on mobile and 24px from 640px. The home page stacks: optional continue-reading strip, featured novel, latest chapters, then the cover grid.

- Featured novel: two columns from 640px (220px cover, 260px from 768px, then text), 32px gap widening to 48px; on mobile the cover centres above at 176px wide and the primary button goes full width.
- Lists are hairline-separated rows (16px vertical padding) with a small 2:3 cover thumbnail (40px wide), title and muted metadata, and a right-aligned date.
- Cover grid: 2 columns, 3 from 640px, 4 from 768px; 20px column gap, 32px row gap.
- Vertical rhythm: sections open with a hairline and 40px top padding, or 56px top padding without a rule; the footer sits 80px below content.
- Header: sticky, 56px tall, wordmark left with plain text nav beside it (from 768px), icon actions pushed right. Under 768px the nav moves into a right-side drawer.

## Elevation & Depth

Flat by default. Depth is reserved for the covers, which are treated as physical books: a soft, diffuse drop shadow under the featured cover at rest, and a similar shadow that appears on grid covers only on hover. The mobile drawer sits over a 50% black scrim. No other element casts a shadow.

### Shadow Vocabulary
- **Book at rest** (`box-shadow: 0 12px 32px -12px rgba(0,0,0,0.45)`): featured cover only.
- **Book lifted** (`box-shadow: 0 10px 24px -10px rgba(0,0,0,0.5)`): grid cover on hover.

### Named Rules
**The Only Books Lift Rule.** Shadows belong to cover images. Text, buttons, lists and navigation stay flat.

## Shapes

Restrained, slightly softened corners. Covers and buttons use a 6px radius; list thumbnails 4px; the only fully round element is the bookmark count badge. Borders are 1px hairlines in the theme border colour, used as dividers (top or bottom edges), never as boxes around content. Covers are always 2:3, object-fit cover.

## Components

### Buttons
- **Shape:** gently rounded (6px).
- **Primary:** accent fill, accent-text label, 12px x 24px, semibold. One per view. Hover moves to accent-hover (0.2s).
- **Secondary:** a plain text link beside the primary, muted, turning ink on hover. No outlined or ghost buttons.
- **Icon buttons:** 20px stroke icons (1.8 stroke) in a borderless 8px-padded hit area, muted turning ink on hover.
- **Focus:** every interactive element gets a 2px accent outline, 2px offset.

### Cover tile
- 2:3 cover with 6px corners, then serif title (accent on hover), author and "chapters · status" in muted label size. No frame, no card behind it.

### Chapter row
- Hairline-separated row: 40px thumbnail, serif novel title, muted chapter line (truncated), muted tabular date right. The whole row is one link; the title turns accent on hover.

### Navigation
- **Header:** page-ground background with a bottom hairline. Nav items 0.9375rem, muted; hover goes ink; the current page is ink and semibold (no underline, no accent).
- **Mobile drawer:** 288px (max 85vw) panel from the right on the page ground with a left hairline, 300ms ease-out slide over a 200ms fading scrim; nav items 1.125rem stacked with hairlines between.
- **Footer:** top hairline, wordmark plus one-line description left, small muted links right; a second hairline row carries copyright and the "Developed by Infiax 360" credit, which must stay.

## Do's and Don'ts

### Do:
- **Do** place content directly on the page ground and separate it with 1px hairlines in the theme border colour.
- **Do** use the theme variables (`--reader-*`, `--theme-accent*`) for every colour so all four themes work.
- **Do** keep the accent to the primary button, hover and active title states, focus rings and the bookmark count.
- **Do** set titles of works in Noto Serif Sinhala and everything else in Noto Sans Sinhala, with tall Sinhala line heights (1.95 for synopsis, 2.15 for prose).
- **Do** show covers at 2:3 and let them be the colour on the page.

### Don't:
- **Don't** wrap content in bordered or rounded panels, cards, genre or status pills, or stat grids (the bookmark count is the only badge).
- **Don't** add a second accent colour, tinted section backgrounds or gradients.
- **Don't** put shadows on anything except cover images.
- **Don't** hard-code hex colours in markup; they break sepia, dark and AMOLED.
