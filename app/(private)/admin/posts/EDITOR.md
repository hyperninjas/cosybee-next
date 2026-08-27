# Post Editor — features & how to use them

The post body uses a block-based editor (BlockNote). Everything is a **block**
(a paragraph, heading, image, list, etc.). Press **Enter** to start a new block,
**Backspace** at the start of an empty block to merge it up.

---

## Inserting content — the “/” slash menu

Type **`/`** anywhere to open the insert menu, then start typing to filter
(e.g. `/img`, `/table`, `/media`). Available blocks:

| Block | What it is |
|-------|------------|
| Heading 1/2/3 | Section titles (also build the article's table of contents) |
| Paragraph | Normal text |
| Bullet / Numbered / Check list | Lists (checklist = to‑do style) |
| Toggle list | Collapsible section |
| Quote | Pull‑quote / blockquote |
| Code block | Monospaced code with syntax highlight |
| Table | Rows & columns |
| Image / Video / File / Audio | Media blocks (see **Media** below) |
| Divider | Horizontal rule |
| **Media library** | Insert an image/video/file you already uploaded (opens the gallery picker) |
| **FAQ question** | Collapsible Q&A — also tells Google it's an FAQ (see **FAQ** below) |
| **Call to action** | Promo card with a heading, image and button (see **Call to action** below) |
| **Table of contents** | Auto‑updating list of this article's H2/H3 headings |
| **Custom HTML** | Embeds (YouTube, Vimeo, Spotify, Maps) or hand‑written markup |
| Columns (multi‑column) | Side‑by‑side layout (see **Layout** below) |

## Quick markdown shortcuts

Type these at the start of a line and they convert automatically:

- `# ` → Heading 1 · `## ` → H2 · `### ` → H3
- `- ` or `* ` → bullet list · `1. ` → numbered list · `[] ` → checklist
- `> ` → quote · ` ``` ` → code block · `---` → divider

## Formatting text (the selection toolbar)

**Select any text** and a toolbar appears with:

- **Bold**, *italic*, underline, strikethrough, inline `code`
- **Text & highlight colour**
- **Link** — click the link button (or just paste a URL onto selected text)
- **Link to page** — link the selection to another page or article on this
  site *without* knowing its URL (see **Linking** below)
- **Link to section** (⚓) — link the selection to a heading in this article
- **Alignment** — left, center, right, and **justify**
- **Block type** — convert the selection to a heading/list/etc.
- **Nesting** — indent / outdent (also `Tab` / `Shift`+`Tab` in lists)

## Media — images, video, files

Two ways to add media; **both put the file in the Media Library** so it can be
reused and is tracked against the post:

1. **Upload new** — drag & drop a file into the editor, paste an image, or add
   an Image/File block and choose a file. It uploads straight to storage and
   drops into your Media Library automatically.
2. **Reuse existing** — type `/Media library`, pick an asset from the gallery,
   and it's inserted.

After inserting an image, select it and use the toolbar to:

- **Alt text** — *required*. A short description of what the image shows, for
  screen readers and search engines. It is not displayed on the page.
  Uploads pre-fill this from the file name when the name is meaningful
  (`worker-bee-symbol.jpg` → "Worker bee symbol"); names like `IMG_5169` or
  `Screenshot 2026-07-17` are ignored, so you'll be asked to write one.
  Images picked from the **Media library** inherit the alt text stored on the
  asset — describe it once in the gallery and it comes across everywhere.
  Leave it blank only if the image is purely decorative.
- **Caption** — *optional*. Text shown **underneath** the image on the page.
  Use it for credits or commentary; leave it empty if the image speaks for
  itself.
- **Resize** it by dragging its edge.

> **Alt vs caption:** alt says *what the image is* (“A worker bee on a
> wildflower”); the caption says *what to tell the reader about it* (“Spring
> forage, Lancashire”). They're often different — that's fine and expected.
> A post can't be saved while a content image has no alt text.

Allowed types: images, video, and documents (PDF/docs). Oversized or unsupported
files are rejected with a message.

## Linking to our own pages

Select the words you want to link, then click **Link to page** in the toolbar.

- The **selected text is used as the search**, so selecting "heat pumps" in
  your sentence brings up the heat‑pump article straight away.
- Type to narrow it down; ↑/↓ move through the list and **Enter** picks the
  highlighted one. Icons show whether a result is a **site page** or a **blog
  post**.
- Only **published** articles appear — a link to a draft would be a dead link
  until someone remembers to publish it.
- Links added this way stay on the site (no "opens in a new tab"), and search
  engines treat them as internal links, which is what passes ranking value
  between our own pages.

Clicking a link while editing puts your cursor in it rather than opening it.
To actually visit the target, click the link and use **Open** in the small
toolbar that appears.

## FAQ questions

Type **`/faq`** to add a question. **The block's own text is the question, and
anything you nest underneath it is the answer** — press **Enter** after typing
the question and the cursor moves into the answer for you.

Add more questions the same way; consecutive ones display as a single
accordion on the published page.

Answers are ordinary content: **bold**, links, bullet lists all work.

> **Why it matters:** an article with FAQ blocks automatically tells Google
> those are questions and answers, which is what can earn the expandable Q&A
> results in search. That only works because the questions are genuinely on
> the page — so don't use FAQ blocks for content that isn't really a FAQ.

A question with no answer yet is simply left out of that data, so a
half‑written one does no harm.

## Call to action

Type **`/cta`** to drop in a promo card — the same card design the marketing
pages use, but with every part under your control.

The card opens with its form showing. Fill in what you want and leave the rest
blank; **anything you leave empty simply isn't shown**, so a card with no
eyebrow, or no button, just doesn't have one.

| Field | What it is |
| --- | --- |
| Eyebrow | Small upper‑case line above the heading |
| Heading | The big line — the main message |
| Body | A sentence or two underneath |
| Button text + Button link | The button. **Both** are needed for it to appear |
| Image | **Choose image** opens the media library; **Remove image** takes it out |
| Image alt text | Describes the image (fills in from the library when it has one) |
| Image on the left / right / No image | Which side the picture sits on |
| In line / Pinned to the top / Pinned to the bottom | How the picture sits in its column (see below) |

Click **Done** when you're finished and the form folds away, leaving the card
exactly as readers will see it. Click **Edit** to change it again.

The **Button link** can be an internal path (`/download`, `/solar`) or a full
external address. Internal links stay in the same tab; external ones open in a
new tab automatically.

> **A note on the heading:** it looks like a heading but deliberately isn't one
> — it stays out of the table of contents and out of the article's heading
> structure, so an advert never gets counted as part of the article's outline.

### Pinning the image

**In line with the text** is the normal setting — the picture is centred
against the copy.

**Pinned to the top / bottom edge** lifts it out and stands it against that
edge of the card, so a tall image (a phone mockup, say) touches the border
instead of floating in the middle. It's the look the app-download card on the
homepage uses.

The column stays the same width either way, so the text never runs underneath.
A pinned image is never allowed to grow taller than the card, and pinning is
ignored when there's no image, or when the side is set to **No image**.

On narrow screens the image moves above the text and the card centres itself,
whichever side you picked — and pinning is ignored there too, since a stacked
card has no side column to pin against.

## Layout — multi‑column

To place blocks side by side, **drag one block to the left/right edge of
another** — they snap into columns. Drag the divider between columns to resize.
On mobile, columns stack vertically automatically.

## Moving & organising blocks

- Hover a block to reveal the **drag handle** (the ⠿ on the left). Drag it to
  reorder, or click it for block actions.
- **Nest** list items / blocks with `Tab`, un‑nest with `Shift`+`Tab`.
- Select a block and **Backspace**/**Delete** to remove it.

## Tables

Insert with `/table`. Click into cells to edit; use the row/column controls that
appear on hover to add or remove rows and columns.

## The URL (slug)

The **Slug** field in *Post details* is the article's address —
`/hive/your-slug`. It is **required** and no longer follows the title, so it
is yours to choose:

- **Generate** fills it in from the title in one click; edit it freely after.
- It's checked as you type: **Available**, or which post already uses it —
  including **drafts**, which the check used to miss.
- Saving is blocked on a clash rather than quietly renaming it, so you get the
  URL you chose or a clear reason why not.

> **Careful with published posts:** changing the slug of a live article breaks
> its existing URL — old links and search results will 404. Only change it if
> you mean to.

## Saving & publishing

The body is part of the post form — it saves when you **Save** (draft) or
**Publish** using the action bar at the top/bottom of the page, alongside the
title, cover image, SEO, tags, etc. There's no separate “save editor” step.
What you see in the editor is what renders on the live article.

---

### Tips
- Use **Headings (H2/H3)** to structure the article — they also generate the
  on‑page table of contents.
- Prefer **reusing** media from the library (`/Media library`) over re‑uploading
  the same file.
- Add **alt text** to every image (required); add a caption only when it adds
  something for the reader.
- Link to our own articles with **Link to page** rather than pasting URLs —
  it can't produce a typo'd or draft link.
- Use **FAQ questions** for genuine Q&A; it's the part search engines can
  surface directly.
- Keep one idea per block — it makes reordering and multi‑column layouts easier.
