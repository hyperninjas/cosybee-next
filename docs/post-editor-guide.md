# Post editor guide

How to use the blog post editor (Admin → Posts). It's a block-based
WYSIWYG editor: everything you write is a **block** (paragraph, heading,
image, table, …) that you can drag to reorder using the handle that appears
to the left of a block on hover.

_Last updated: 2026-07-31._

## The basics

- **`/` — the slash menu.** Type `/` on an empty line (or press it anywhere)
  to insert any block: headings, lists, quote, code, table, image/video/file,
  columns, and the custom blocks below. Keep typing to filter (e.g. `/tab`).
- **Formatting toolbar.** Select text to get bold/italic/underline/strike,
  text alignment (left/center/right/justify), colors, link buttons, and
  **Link to section** (see below).
- **Multi-column layout.** Insert via the slash menu ("Two columns" /
  "Three columns"). Drag the seam between columns to resize; columns stack
  vertically on phones automatically.

## Headings — use them deliberately

Use **Heading 2** for sections and **Heading 3** for subsections. They power
everything anchor-related:

- Every published H2/H3 automatically gets an **anchor id** derived from its
  text ("Getting started" → `#getting-started`; duplicate titles get `-2`,
  `-3`, …).
- The desktop sidebar "On this page" outline is built from H2/H3 only.
- The table of contents block and the "Link to section" picker only see
  H2/H3. **Heading 1 is invisible to all of these** — reserve it for rare
  display-only use; the post title is already the page's H1.

Renaming a heading changes its anchor id on the next publish. In-article
links made with the tools below update automatically, but links shared
externally to that specific `#anchor` will stop scrolling.

## Table of contents block

Type `/toc` (aliases: contents, outline).

- **In the editor**: a live "Contents" card listing the article's H2/H3s,
  updated as you edit. Click an entry to jump to that heading.
- **Published**: the same list as anchor links; clicking scrolls smoothly to
  the section. It always matches the real headings — nothing to maintain.
- An article with no H2/H3 headings publishes the block as nothing (hidden).

This is separate from the automatic sidebar outline (desktop only); use the
block when you want a TOC **inside** the article body, visible on mobile too.

## Links

Select text → link button (or paste a URL onto selected text).

- **Link to section** (anchor icon next to the link button): links the
  selected text to one of this article's H2/H3 sections — pick from the
  list, no need to type `#anchors` by hand. Ideal for hand-made jump lists
  (e.g. a curated "In this guide" table).
- **Manual anchors** still work if you prefer: use `#the-heading-slug` as
  the URL (lowercase, hyphens, punctuation dropped).
- **SEO rel toggles**: click an existing link to open its toolbar — next to
  edit/open/delete are **nofollow / sponsored / ugc** toggles:
  - `nofollow` — "don't pass ranking credit" (untrusted or unendorsed sites)
  - `sponsored` — paid/affiliate links (Google requires this)
  - `ugc` — user-generated content links
  Active tokens show as a small badge after the link text in the editor.
- **Automatic policy on publish** (no action needed): internal links open in
  the same tab and pass ranking credit; external links open in a new tab
  with `noopener noreferrer` plus whatever tokens you toggled.

## Tables

Insert via `/table`. The first row is the header row (bold, left-aligned).
Drag column edges to resize — the widths are kept on the published page, and
a table wider than the article column scrolls sideways on small screens
instead of breaking the layout.

For a table the built-in editor can't express (merged custom styling,
colored cells beyond the color menu), use a **custom HTML block** instead.

## Custom HTML block (embeds & hand-written markup)

Type `/html` (aliases: embed, iframe).

- The block shows a **live preview** plus an **Edit/Apply** button that
  toggles a source editor. A newly inserted block starts in edit mode.
- **Embeds**: paste the embed `<iframe>` snippet from YouTube, Vimeo,
  Spotify, or Google Maps ("Share → Embed" on those sites). Embeds without
  explicit sizing render responsive 16:9. Iframes from **any other site are
  removed** — ask a developer to extend the allowlist if you need another
  provider.
- **Hand-written markup**: tables, styled boxes, etc. Tags like
  `table/div/span/p/a/img` with `class` and inline `style` are kept.
- **What's always stripped** (security): `<script>`, event handlers
  (`onclick=` …), `javascript:` URLs. The preview shows exactly what will
  publish — if something vanishes in the preview, it was stripped.

## Images, video & files

- **Drag & drop or paste** a file into the editor — it uploads to the media
  library (videos are transcoded and get a poster) and is tracked as used by
  this post.
- **/Media library** (aliases: media, gallery, asset): reuse an existing
  library file instead of uploading a copy.
- **Alt text is required**: the image's caption doubles as its alt text, and
  a post whose images lack alt/caption is rejected on save. Fill the caption
  in the media library (or on the block) — it's shown under the image AND
  read by screen readers/search engines.

## Good-practice checklist before publishing

- Sections are H2, subsections H3 (so TOCs and anchors work).
- Every image has a caption/alt.
- Affiliate or paid links have `sponsored` toggled on.
- Long articles: consider a `/toc` block near the top (mobile readers don't
  see the sidebar outline).
- Custom HTML blocks: check the preview — what you see there is exactly what
  publishes.

## How this fits the pipeline (for developers)

The editor stores the document as BlockNote JSON (`contentJson`, canonical)
plus a pre-rendered sanitized `contentHtml` fallback. Rendering, the link
policy, anchor generation, and sanitization are documented in
`eb-auth/docs/post-content-pipeline.md`; the editor implementation lives in
`app/(private)/admin/posts/Editor.tsx` and the shared schema in
`app/lib/blocknoteSchema.ts`.
