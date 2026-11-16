---
name: Katha Arana (කතා අරණ)
description: Free, account-free serialized Sinhala novels in an app-style shell of cards, charts and a reading card.
colors:
  accent: "#0f766e"
  accent-hover: "#115e59"
  accent-text: "#ffffff"
  accent-soft: "rgba(15, 118, 110, 0.1)"
  star: "#d97706"
  like: "#e11d48"
  ground: "#f4f5f7"
  panel: "#ffffff"
  ink: "#16181d"
  ink-muted: "#5f6570"
  border: "#e3e5ea"
  dark-accent: "#2dd4bf"
  dark-accent-hover: "#5eead4"
  dark-accent-text: "#00201c"
  dark-accent-soft: "rgba(45, 212, 191, 0.14)"
  dark-star: "#fbbf24"
  dark-like: "#fb7185"
  dark-ground: "#000000"
  dark-panel: "#0c0c0c"
  dark-ink: "#ececec"
  dark-ink-muted: "#a0a0a0"
  dark-border: "#222222"
  sepia-accent-soft: "rgba(15, 118, 110, 0.12)"
  sepia-star: "#b45309"
  sepia-like: "#be123c"
  sepia-ground: "#efe6d0"
  sepia-panel: "#f7f0de"
  sepia-ink: "#433422"
  sepia-ink-muted: "#6f5d48"
  sepia-border: "#dccfb4"
typography:
  headline:
    fontFamily: "Noto Serif Sinhala, Georgia, serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.375
  title:
    fontFamily: "Noto Serif Sinhala, Georgia, serif"
    fontSize: "1.125rem"
    fontWeight: 700
  card-title:
    fontFamily: "Noto Serif Sinhala, Georgia, serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.375
  wordmark:
    fontFamily: "Noto Serif Sinhala, Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 700
  body:
    fontFamily: "Noto Sans Sinhala, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
  ui:
    fontFamily: "Noto Sans Sinhala, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
  synopsis:
    fontFamily: "Noto Sans Sinhala, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.95
  prose:
    fontFamily: "Noto Sans Sinhala, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 2.15
  label:
    fontFamily: "Noto Sans Sinhala, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
  caption:
    fontFamily: "Noto Sans Sinhala, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
  tab-label:
    fontFamily: "Noto Sans Sinhala, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 400
rounded:
  thumb: "4px"
  control: "8px"
  surface: "14px"
  dialog: "16px"
  sheet: "20px"
  full: "9999px"
spacing:
  gutter: "16px"
  gutter-sm: "24px"
  gutter-lg: "32px"
  card-pad-tight: "12px"
  card-pad: "16px"
  card-pad-wide: "24px"
  grid-gap: "12px"
  grid-gap-sm: "16px"
  rail-gap: "14px"
  section-gap: "24px"
  sidebar: "16rem"
  top-bar: "56px"
  reader-bar: "56px"
  container: "72rem"
  side-column: "21rem"
  reading-column: "48rem"
  prose-measure: "40rem"
components:
  surface:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "16px"
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-text}"
    rounded: "{rounded.control}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  icon-button-outlined:
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.control}"
    size: "44px"
  icon-button-outlined-active:
    textColor: "{colors.like}"
  cover-like:
    backgroundColor: "rgba(0, 0, 0, 0.5)"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    size: "36px"
  chip:
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.full}"
    padding: "6px 14px"
  chip-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.panel}"
  reaction:
    rounded: "{rounded.full}"
    padding: "8px 14px"
  reaction-active:
    backgroundColor: "{colors.accent-soft}"
  novel-card:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.surface}"
    padding: "12px"
  list-row:
    padding: "10px 0"
  nav-item:
    textColor: "{colors.ink-muted}"
    typography: "{typography.ui}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  nav-item-active:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
  bottom-tab:
    textColor: "{colors.ink-muted}"
    typography: "{typography.tab-label}"
  bottom-tab-active:
    textColor: "{colors.accent}"
  top-bar:
    backgroundColor: "{colors.panel}"
    height: "{spacing.top-bar}"
  sidebar:
    backgroundColor: "{colors.panel}"
    width: "{spacing.sidebar}"
  sheet:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
---

# Design System: Katha Arana (කතා අරණ)

## Overview

**Creative North Star: "The Pocket Library"**

The site behaves like an installed reading app. A fixed shell (sidebar on desktop, top bar and five bottom tabs on phones) holds a grey ground on which white cards sit: a featured novel, a ranked chart, latest chapters, a grid of cover cards, and on chapter pages one large reading card. Ratings, likes, views and reactions are first-class content, shown as small counts beside a star, a heart or an eye rather than as decoration.

Density is app-like but not crowded: 16px card padding, 24px between cards, lists divided by hairlines inside their card. Everything interactive answers a touch (a 3% press-in) and the reading surface keeps tall Sinhala line heights. Light is the default theme; dark is pure black with neutral greys; sepia is a reading option. Every colour comes from the theme variables so the three themes stay in step.

**Key Characteristics:**
- Two-tone grounding: a tinted app ground with panel-coloured cards, bars and sidebar on top.
- One card class for every container (14px corners, 1px border, a near-invisible shadow in light only).
- App shell: 16rem sidebar from 1024px; sticky top bar plus five bottom tabs below it; a reader bar replaces the tabs while reading.
- Teal accent for the primary action, the current tab and the next step; amber for stars and rose for likes are the only other colours in the chrome.
- Serif (Noto Serif Sinhala) names things; sans (Noto Sans Sinhala) is for everything operated or read at length.
- Phone order is source order; wide screens rearrange the same sections into a main column and a 21rem side column.

## Colors

Neutral greys carry the interface in all three themes; a single teal accent and two semantic colours (star amber, like rose) do the pointing.

### Primary
- **Reading-Room Teal** (accent): the primary button, the active bottom tab, the reading progress bar, the next-chapter cue, text links such as "view all", focus outlines. Hover deepens to accent-hover; the label on a filled button is accent-text.
- **Lamplight Teal** (dark-accent): the same role on black, brighter so it holds on a pure-black ground, with near-black teal text (dark-accent-text) on filled buttons. Hover lightens to dark-accent-hover.
- **Teal Wash** (accent-soft, dark-accent-soft, sepia-accent-soft): translucent tint behind a chosen reaction, the library count badge and text selection.

### Secondary
- **Star Amber** (star, dark-star, sepia-star): filled rating stars only, both the small read-only star beside an average and the stars a reader has pressed.
- **Like Rose** (like, dark-like, sepia-like): a pressed heart only. An unpressed heart is muted ink.

### Neutral
- **Ground / Panel / Ink / Muted / Border** (ground, panel, ink, ink-muted, border): light theme. Ground is the app background and the hover/active fill for sidebar items; panel is every card, bar and the sidebar; muted is metadata, counts and inactive navigation; border is card edges and in-card dividers.
- **Black set** (dark-ground, dark-panel, dark-ink, dark-ink-muted, dark-border): the dark theme. Ground is true black, panels sit one step above it, and every grey is neutral (equal red, green and blue).
- **Sepia set** (sepia-ground, sepia-panel, sepia-ink, sepia-ink-muted, sepia-border): a warm paper theme offered from the reader sheet.

In code these resolve through `--reader-bg`, `--reader-panel`, `--reader-text`, `--reader-muted`, `--reader-border`, `--theme-accent*`, `--star` and `--like`, switched by `data-theme` on `<html>` (no attribute value means light). Always reference the variables, never the hex.

### Named Rules
**The Pure Black Rule.** Dark means #000000 ground and neutral greys. No navy, slate or blue-tinted grey anywhere in the dark theme, including borders and muted text.

**The Three Signals Rule.** Teal means act or you-are-here, amber means rating, rose means liked. Nothing else in the chrome takes a colour; covers supply the rest.

**The Inverted Chip Rule.** A selected filter chip is ink on panel reversed (ink fill, panel text), not accent. The accent stays free for actions.

## Typography

**Display Font:** Noto Serif Sinhala (with Georgia, serif)
**Body Font:** Noto Sans Sinhala (with system-ui, sans-serif)

Both are self-hosted through the Astro fonts API (weights 400 to 700, Sinhala and Latin subsets) and exposed as `--font-si-serif` and `--font-si-sans`.

**Character:** A bookish serif for page titles, card headings, novel titles, rank numbers and the wordmark, against a plain sans for controls, metadata and long reading. The scale is compact, as in an app: the largest heading is 1.875rem. Sinhala script needs height, so line heights run tall.

### Hierarchy
- **Headline** (700, 1.5rem rising to 1.875rem from 640px, 1.375): the one page title: home heading, novel title, chapter title (chapter title at 1.4, balanced wrap). The featured novel's title on home runs one step smaller (1.25rem / 1.5rem).
- **Title** (700, 1.125rem): the heading of each card or section (top novels, latest chapters, chapters, rate this novel).
- **Card title** (600, 17px, 1.375): novel titles in cover cards, chart rows, latest-chapter rows and continue-reading cards; clamps to two lines in a cover card, one line in a row. Rank and chapter numbers use the same serif at 1.125rem bold, muted, tabular.
- **Wordmark** (700, 1.25rem in the sidebar, 1.125rem in the top bar): the site name.
- **Body** (400, 17px): default text.
- **UI** (400, 0.9375rem; 600 when current): sidebar items, sub-headings under a page title, sheet list rows.
- **Synopsis** (400, 1.0625rem, 1.95, max 42rem): the novel page synopsis. The three-line teaser on the home featured card is 0.9375rem at 1.85.
- **Prose** (400, 17px adjustable through `--reader-font-size`, 2.15, 1.6em between paragraphs, max 40rem): chapter text. The reader can switch it to the serif.
- **Label** (400, 0.875rem, muted; 600 for a count that matters): metadata lines, chips, counts, secondary links. Small group headings inside the sheet and sidebar are label size, 600, muted, in sans.
- **Caption** (400, 0.75rem, muted): dates, rating counts, chapter counts, footer.
- **Tab label** (400, 0.6875rem; 600 when active): bottom tab captions, truncated to one line.

Figures that change or line up (ratings, counts, dates, ranks) use tabular numerals.

### Named Rules
**The Serif Names Things Rule.** Serif is for titles of works, page and card headings, rank numbers and the wordmark. Buttons, navigation, metadata and small group headings stay sans.

## Layout

An app shell around a single content column.

- **Shell, 1024px and up:** a fixed 16rem sidebar on the left (wordmark, five destinations, a continue-reading list, theme toggle and RSS at the foot); content is offset by the same 16rem. No top bar, no bottom tabs.
- **Shell, below 1024px:** a sticky 56px top bar (logo or back arrow, wordmark, theme toggle) and a fixed five-tab bottom bar. Inner pages show a back arrow to their parent path in place of the logo. On chapter pages a fixed reader bar takes the place of the tabs.
- **Safe areas:** bottom bars add `env(safe-area-inset-bottom)`; the footer reserves 5.5rem plus the inset so nothing hides behind the tabs; scroll padding (4.5rem top, 5.5rem bottom) keeps focused items clear of both bars.
- **Content column:** max 72rem, centred, with 16px gutters, 24px from 640px, 32px from 1024px; 20px top padding, 32px on desktop. Chapter pages use a 48rem column with a 40rem prose measure.
- **Stacking:** cards and sections are 24px apart. From 1280px, home and novel pages split into a fluid main column and a 21rem side column (charts, latest chapters, related novels). Source order is the phone order.
- **Cover grid:** 2 columns, 3 from 640px, 4 from 768px, 3 again at 1280px beside the side column, 4 from 1536px; 12px gaps, 16px from 640px.
- **Rails:** horizontal, swipeable, snap to card starts, no visible scrollbar, 14px gap; on phones a rail bleeds to the screen edges and its first card lines up with the gutter.
- **Card padding:** 16px, growing to 20 or 24px from 640px on the large cards; 12px inside a cover card's text block.
- **Reading card on phones:** edge to edge, no side borders or corners, 20px side padding; from 640px it becomes a normal card with 40px padding.
- **Navigation between pages** uses Astro's client router, so the shell persists and pages swap in place.

## Elevation & Depth

Mostly tonal: depth comes from panel-on-ground contrast and a 1px border. Shadows are faint and few, and in dark and sepia the resting card shadow is switched off entirely, leaving border and tone to do the work.

### Shadow Vocabulary
- **Card rest** (`box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04)` in light; `none` in dark and sepia): every card at rest. Token `--card-shadow`.
- **Lift** (`box-shadow: 0 12px 28px -12px rgba(16, 24, 40, 0.28)` in light; black at 0.9 in dark; warm brown at 0.35 in sepia): a cover card on hover, and the large cover on the featured card and novel page at rest. Token `--lift-shadow`.
- **Scrim** (`rgba(0, 0, 0, 0.55)`): behind the reader sheet.

### Named Rules
**The Border Before Shadow Rule.** A card must read as a card with its shadow removed, because in dark and sepia it is. Never rely on a shadow alone to separate a surface from the ground.

**The Covers Lift Rule.** The lift shadow belongs to covers and to cover cards under a pointer. Bars, the sidebar, buttons and list cards stay flat.

## Shapes

Soft, consistent corners in a short scale: cards 14px; controls, navigation items and large covers 8px; small cover thumbnails in rows 4px; chips, reaction buttons, the like button on a cover and count badges fully round. The reader sheet has 20px top corners on phones and becomes a 16px dialog from 640px. Borders are 1px in the theme border colour, used as card edges and as dividers between rows inside a card. Bars and the sidebar are separated from content by a single border edge, never a shadow. Covers are always 2:3, cropped to fill.

Icons come from one set: 24px grid, 1.8 stroke, round caps and joins, drawn in the current text colour, shown at 20px by default (22px in bottom tabs, 16px inline with counts, 32px for tappable rating stars). A filled variant exists only for state: a pressed heart, bookmark or star, and the small amber star beside an average.

## Components

### Buttons
- **Shape:** softly rounded (8px).
- **Primary:** accent fill, accent-text label, 600 weight, 10px by 20 to 24px padding. Full width on phones beside a like button, natural width from 640px. Hover moves to accent-hover. One per card.
- **Outlined icon button:** 44px square, 1px border, muted icon; used for the like action beside a primary button. Pressed, the heart fills and turns like rose.
- **Plain icon button:** icon in a borderless hit area with 10px padding (theme toggle, back arrow, bookmark, close).
- **Text link:** 0.875rem, 500 weight, accent, for "view all"; muted for quieter links such as RSS.
- **Press:** every tappable control scales to 0.97 while pressed (120ms), with 150ms colour transitions. Removed under reduced motion.
- **Focus:** a 2px accent outline, 2px offset, on every interactive element.

### Chips
- **Filter chip (chart tabs):** fully round, 1px border, 6px by 14px, 0.875rem muted text. Selected: ink fill, panel text, ink border.
- **Genre chip:** same outline at 4px by 12px, a link to the genre; text goes ink on hover.
- **Reaction button:** fully round, 1px border, 8px by 14px, an emoji at 1.25rem and a tabular count. Chosen: accent border and accent-soft fill. The emoji here are the content readers pick, each with a text label for assistive technology; they are not icons.
- **Count badge:** fully round, accent-soft fill with accent text in the sidebar; solid accent on the bottom tab.

### Cards / Containers
- **Corner Style:** 14px.
- **Background:** panel on the ground.
- **Shadow Strategy:** card rest; see Elevation.
- **Border:** 1px in the theme border colour.
- **Internal Padding:** 16px, 20 to 24px on large cards from 640px.
- **Heading:** a serif title at the top left; an optional small link or count at the top right on the same baseline.
- **Linked card:** when the whole card is a link (next and previous chapter, continue reading) it takes the press feedback. The card that leads onward carries an accent border and an accent caption; the others stay neutral.

### Novel card
A card clipped to its corners: a 2:3 cover on top, a round 36px like button (white heart on 50% black) in the cover's top-right corner, then a 12px-padded block with the two-line serif title, author, "genre · status" caption, and a bottom row pinned to the card's foot with amber star, average, rating count on the left and chapter count on the right. On hover the card takes the lift shadow and the cover scales to 1.03 over 300ms.

### List row
The row inside a chart, latest-chapters, chapter-list or related card: rows divided by 1px borders, 10 to 12px vertical padding, 12px gaps. From the left: an optional muted serif rank or chapter number in a fixed-width slot, a 40 by 60px cover thumbnail (4px corners) where the row is about a novel, a serif title with a muted one-line sub-line, then a caption-size tabular date or a small chevron on the right. The whole row is one link.

### Stat line
Inline counts in muted label size, 16px apart: amber filled star with the average in ink at 600 and the rating count in caption; outline heart with likes; outline eye with views. An unrated novel shows a dash, never a zero or an invented figure.

### Rating stars
Five 32px outline stars, each in a 6px-padded hit area, muted until pressed, then filled star amber. A status line in muted label size sits beside them and announces changes politely.

### Navigation
- **Sidebar:** panel background, right border. Items are 0.9375rem with a 20px icon, 10px by 12px padding, 8px corners; muted by default, ground fill and ink text on hover; the current page has the ground fill, ink text and 600 weight (no accent). The continue-reading list and the foot row are separated by top borders.
- **Top bar:** panel background, bottom border, 56px. Back arrow on inner pages.
- **Bottom tabs:** five equal columns on the panel colour with a top border; a 22px icon over a 0.6875rem caption; muted by default, accent and 600 when current.
- **Reader bar:** fixed at the bottom on the panel colour, offset by the sidebar on desktop. A 2px accent progress line runs along its top edge. One 56px row: previous, the chapter button that opens the sheet, text size down and up, bookmark, next. Next is the only filled accent control; a missing previous or next is shown at 30% opacity.
- **Footer:** caption-size muted line above a top border, carrying the copyright and the "Developed by Infiax 360" credit, which must stay.

### Reader sheet
A native dialog. On phones it rises from the bottom at full width with 20px top corners and no bottom border, up to 85% of the viewport height; from 640px it is a centred 28rem dialog with 16px corners. Header row with the novel title and a close button over a border, then scrollable groups: theme (three swatch buttons that preview each theme's own panel and ink colours), typeface (two buttons, the serif one set in serif), and the chapter list. The chosen swatch or typeface gets an accent border plus a 1px accent ring.

## Do's and Don'ts

### Do:
- **Do** put content in cards on the app ground: panel background, 1px theme border, 14px corners, 16px padding.
- **Do** use the theme variables (`--reader-*`, `--theme-accent*`, `--star`, `--like`, `--card-shadow`, `--lift-shadow`) for every colour and shadow so light, dark and sepia all work.
- **Do** keep dark at pure black ground with neutral greys.
- **Do** design the phone layout first and let source order be the phone order; add the side column at 1280px.
- **Do** give every tappable control the press feedback and a hit area of at least 36px, 44px for standalone buttons.
- **Do** draw icons from the single icon set at 1.8 stroke in the current text colour, and fill them only to show a pressed state or a rating.
- **Do** show real numbers only: a dash for an unrated novel, zero for no likes.
- **Do** keep bars clear of device edges with the safe-area inset and reserve room so the bottom bar never covers content.

### Don't:
- **Don't** use navy, slate or any blue-tinted grey in the dark theme.
- **Don't** hard-code colours in markup; the reader-sheet theme swatches are the single exception because they preview other themes.
- **Don't** colour anything in the chrome except with teal (action, current), amber (rating) and rose (liked).
- **Don't** use the accent for selected filter chips or the current sidebar item; those use ink and ground.
- **Don't** separate a card from the ground by shadow alone, or add shadows to bars, the sidebar or buttons.
- **Don't** use emoji as icons. Emoji appear only as the chapter reaction choices.
- **Don't** set buttons, navigation or metadata in the serif.
- **Don't** introduce a second card style, radius or border weight for containers.
