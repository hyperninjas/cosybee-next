# Post Editor — User Manual

The post body is written in a **block editor** (BlockNote — works like Notion).
Everything you write is a **block**: a paragraph, a heading, an image, a list…
You build the article by stacking and arranging blocks.

**The 4 things to remember:**

1. Type **`/`** to insert anything (headings, images, embeds…).
2. **Select text** to format it (a toolbar pops up).
3. **Hover a block** and drag the **⠿ handle** (left side) to move it.
4. Nothing is saved until you press **Save draft / Publish** at the top.

---

## What's new — August 2026

Four recent additions to the editor:

- **Table of contents** — type `/toc` for a live "Contents" box built from the
  article's Heading 2/3s; entries become clickable links on the published page.
  See section 6.
- **Custom HTML block** — type `/html` and write any HTML with inline CSS in
  it, or paste embed codes. Scripts are stripped for safety; iframes only from
  approved sites. See section 7.
- **Follow / nofollow links** — click any link to toggle **nofollow**,
  **sponsored** or **ugc** on it. See section 4.
- **Link to section (⚓)** — connect selected text to any Heading 2 or 3 of the
  page — pick it from a list, no hand-typed anchors. See section 4.

---

## 1. Writing basics

- Click anywhere and type. **Enter** starts a new block.
- **Backspace** at the start of an empty block deletes it and moves you up.
- Undo/redo: **Ctrl/Cmd + Z** and **Ctrl/Cmd + Shift + Z**.
- These markdown shortcuts convert automatically — type them at the start of
  an empty line, followed by a space:

  | Type…         | Get                   |
  | ------------- | --------------------- |
  | `##` or `###` | Heading 2 / Heading 3 |
  | `-` or `*`    | Bullet list           |
  | `1.`          | Numbered list         |
  | `[]`          | Checklist             |
  | `>`           | Quote                 |
  | 3 backticks   | Code block            |
  | `---`         | Divider               |

> **Headings tip:** use **Heading 2** for sections and **Heading 3** for
> sub-sections — these two levels build the article's table of contents.
> Skip Heading 1 in the body: the post title is already the page's main heading.

## 2. Inserting blocks — the `/` menu

Type **`/`** to open the insert menu, then keep typing to filter
(e.g. `/head`, `/img`, `/toc`, `/media`). What's available:

| Group  | Blocks                                                        |
| ------ | ------------------------------------------------------------- |
| Text   | Headings 1–6, Toggle headings (collapsible), Paragraph, Quote |
| Lists  | Bullet, Numbered, Checklist, Toggle list (collapsible)        |
| Media  | Image, Video, Audio, File, **Media library**, **Custom HTML** |
| Layout | Table, Two/Three Columns, Divider                             |
| Other  | Code block, Emoji, **Table of contents**                      |

The three **bold** ones are special to our site — see sections 5–7.

## 3. Formatting text

**Select some text** and the toolbar appears:

- **Bold** (Ctrl/Cmd+B), _italic_ (Ctrl/Cmd+I), underline (Ctrl/Cmd+U),
  ~~strikethrough~~, inline `code`
- **Text colour** and **highlight colour**
- **Alignment** — left, centre, right, justify
- **Turn into** — convert the block to a heading, list, quote…
- **Indent / outdent** — also **Tab** / **Shift+Tab** inside lists
- **Link** — see next section
- **⚓ Link to section** — see next section

## 4. Links

- **Add a link:** select text and click the link button — or just paste a URL
  onto the selected text.
- **Edit a link:** click it — a small toolbar offers **Edit**, **Open** and
  **Delete**.
- **Link to a section of this article:** select text and click the **anchor
  (⚓) button**, then pick a heading from the list. Readers who click it jump
  straight to that section. (The button appears once the article has
  Heading 2/3s.)
- **SEO toggles** (in the link toolbar): **nofollow**, **sponsored**, **ugc**.
  Most links need none of these. Turn on **sponsored** for paid or affiliate
  links, **ugc** for links submitted by users, **nofollow** when we don't want
  to vouch for the target site.
- You never need to worry about "open in new tab" — when the post is
  published, links to other websites open in a new tab automatically and
  internal links stay in the same tab.

## 5. Images, video & files

Two ways to add media — **both** end up in the shared Media Library, so the
file can be reused later:

1. **Upload new** — drag & drop a file into the editor, paste an image, or
   insert an Image/Video/File block and choose a file.
2. **Reuse existing** — type **`/media`** → **Media library** → pick from the
   gallery. Pictures, videos and documents you (or anyone) already uploaded
   are all there.

After inserting:

- **Add a caption** — click below the image and type. The caption doubles as
  the image's **alt text** (what screen readers and Google see).
- ⚠️ **Every image must have a caption/alt before the post can be saved.**
  If any are missing, a yellow warning above the editor tells you which
  image (#1, #2…) and the Save/Publish buttons stay disabled until fixed.
  Media inserted from the library usually arrives with its caption pre-filled.
- **Resize** an image or video by dragging its side handles.
- Videos are optimised automatically after upload (converted for the web and
  given a preview image) — nothing for you to do.

Allowed files: images, videos and documents (PDF etc.). Unsupported or
oversized files are rejected with a message telling you why.

## 6. Table of contents - New

Type **`/toc`** → **Table of contents**. It inserts a "Contents" box that
lists every Heading 2 and Heading 3 in the article.

- It updates **live** while you write — no maintenance.
- In the editor, click an entry to jump to that section.
- On the published page, the entries become links that scroll the reader there.
- Best placed near the top, right after the intro paragraph.

## 7. Custom HTML & embeds (YouTube, Maps…) - New

Type **`/html`** → **Custom HTML**. Use it to embed things the normal blocks
can't:

1. Paste an embed code (the `<iframe>…` snippet sites give you under
   "Share → Embed") — or write your own HTML. Inline CSS (`style="…"`) works,
   so you can style it freely.
2. Press **Apply** to see the preview. **Edit** brings the code back.

The preview is exactly what readers will see. For safety, scripts are removed
automatically, and iframe embeds only work from **YouTube, Vimeo, Spotify and
Google Maps** — embeds from other sites are silently dropped.

## 8. Side-by-side columns

- Type **`/columns`** and pick **Two** or **Three Columns**, **or** drag a
  block to the **left/right edge** of another block until it snaps in beside it.
- Drag the gap between columns to change their widths.
- Drag a block out of a column to dissolve it.
- On phones, columns stack on top of each other automatically.

## 9. Moving & organising blocks

- Hover a block → **⠿ drag handle** appears on the left. Drag it to move the
  block; click it for actions (delete, duplicate, colours…).
- **Tab / Shift+Tab** nests / un-nests list items.
- **Tables:** type `/table`. Click into cells to type; hover the edges for
  **+** buttons and handles to add, move or delete rows and columns.

## 10. Saving & publishing

The editor is part of the post form — one save covers everything (body, title,
cover, tags, SEO…):

- **Save draft** — saves without publishing.
- **Publish / Update** — makes it live (or updates the live version).
- Leaving the page with unsaved changes triggers a browser warning.
- What you see in the editor is what readers see on the live article.

---

### Quick tips

- Structure with **Heading 2/3** — they power the table of contents.
- **Reuse** media via `/media` instead of uploading the same file twice.
- Caption **every image** — the post won't save without it.
- Keep **one idea per block** — easier to reorder and to arrange in columns.
