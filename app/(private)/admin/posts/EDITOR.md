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

Recent additions to the editor:

- **FAQ questions** — type `/faq` for a collapsible Q&A that also tells search
  engines it's an FAQ. See section 6.
- **Link to page** — link selected text to another page or article on this
  site without knowing its URL. See section 4.
- **You choose the URL** — the slug no longer follows the title, and is
  checked for clashes as you type. See section 12.
- **Alt text for images** — images now have their own **Alt text** field,
  separate from the caption. Alt text is required; captions are optional.
  See section 5.
- **Your writing saves itself** — press **Start draft** once you have a slug,
  and from then on your work is saved a few seconds after you stop typing. On
  a live post those edits stay private until you press Update. See section 13.
- **Call to action** — type `/cta` for a promo card with its own heading,
  image and button, every part of it editable. See section 9.
- **Table of contents** — type `/toc` for a live "Contents" box built from the
  article's Heading 2/3s; entries become clickable links on the published page.
  See section 7.
- **Custom HTML block** — type `/html` and write any HTML with inline CSS in
  it, or paste embed codes. Scripts are stripped for safety; iframes only from
  approved sites. See section 8.
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
(e.g. `/head`, `/img`, `/faq`, `/cta`, `/toc`, `/media`). What's available:

| Group  | Blocks                                                          |
| ------ | --------------------------------------------------------------- |
| Text   | Headings 1–6, Toggle headings (collapsible), Paragraph, Quote   |
| Lists  | Bullet, Numbered, Checklist, Toggle list (collapsible)          |
| Media  | Image, Video, Audio, File, **Media library**, **Custom HTML**   |
| Layout | Table, Two/Three Columns, Divider                               |
| Other  | Code block, Emoji, **FAQ question**, **Call to action**, **Table of contents** |

The **bold** ones are special to our site — see sections 5–9.

## 3. Formatting text

**Select some text** and the toolbar appears:

- **Bold** (Ctrl/Cmd+B), _italic_ (Ctrl/Cmd+I), underline (Ctrl/Cmd+U),
  ~~strikethrough~~, inline `code`
- **Text colour** and **highlight colour**
- **Alignment** — left, centre, right, justify
- **Turn into** — convert the block to a heading, list, quote…
- **Indent / outdent** — also **Tab** / **Shift+Tab** inside lists
- **Link**, **🔗 Link to page** and **⚓ Link to section** — see next section

## 4. Links

- **Add a link:** select text and click the link button — or just paste a URL
  onto the selected text.
- **Link to another page on this site** (🔗): select the words you want to
  link and click **Link to page**. **The selected text is used as the
  search** — selecting "heat pumps" brings up the heat-pump article straight
  away. Type to narrow it down, ↑/↓ to move, **Enter** to pick. Icons show
  whether a result is a **site page** or a **blog post**. Only **published**
  articles appear: a link to a draft would be a dead link until someone
  remembers to publish it.
- **Link to a section of this article** (⚓): select text, click the anchor
  button, then pick a heading. Readers who click it jump straight to that
  section. (Appears once the article has Heading 2/3s.)
- **Edit a link:** click it — a small toolbar offers **Edit**, **Open** and
  **Delete**. Clicking a link while editing puts your cursor in it rather than
  opening it; use **Open** to actually visit the target.
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

After inserting an image, select it and use the toolbar:

- **Alt text** — _required_. A short description of what the image shows, for
  screen readers and search engines. It is **not** shown on the page.
  Uploads pre-fill it from the file name when the name is meaningful
  (`worker-bee-symbol.jpg` → "Worker bee symbol"); names like `IMG_5169` or
  `Screenshot 2026-07-17` are ignored, so you'll be asked to write one.
  Images picked from the **Media library** inherit the alt text stored on the
  asset — describe it once in the gallery and it comes across everywhere.
  Leave it blank only if the image is purely decorative.
- **Caption** — _optional_. Text shown **underneath** the image on the page.
  Use it for credits or commentary; leave it empty if the image speaks for
  itself.
- **Resize** an image or video by dragging its side handles.

> **Alt vs caption:** alt says _what the image is_ ("A worker bee on a
> wildflower"); the caption says _what to tell the reader about it_ ("Spring
> forage, Lancashire"). They're often different — that's fine and expected.

⚠️ **A post can't be saved while a content image has no alt text.** If any are
missing, a warning above the editor names them (#1, #2…) and the Save/Publish
buttons stay disabled until they're described.

Videos are optimised automatically after upload (converted for the web and
given a preview image) — nothing for you to do.

Allowed files: images, videos and documents (PDF etc.). Unsupported or
oversized files are rejected with a message telling you why.

## 6. FAQ questions

Type **`/faq`** to add a question. **The block's own text is the question, and
anything you nest underneath it is the answer** — press **Enter** after typing
the question and the cursor moves into the answer for you.

Add more questions the same way; consecutive ones display as a single
accordion on the published page, which readers expand one at a time.

Answers are ordinary content: **bold**, links and bullet lists all work.

> **Why it matters:** an article with FAQ blocks automatically tells Google
> those are questions and answers, which is what can earn the expandable Q&A
> results in search. That only works because the questions are genuinely on
> the page — so don't use FAQ blocks for content that isn't really a FAQ.

A question with no answer yet is simply left out of that data, so a
half-written one does no harm.

## 7. Table of contents

Type **`/toc`** → **Table of contents**. It inserts a "Contents" box that
lists every Heading 2 and Heading 3 in the article.

- It updates **live** while you write — no maintenance.
- In the editor, click an entry to jump to that section.
- On the published page, the entries become links that scroll the reader there.
- Best placed near the top, right after the intro paragraph.

## 8. Custom HTML & embeds (YouTube, Maps…)

Type **`/html`** → **Custom HTML**. Use it to embed things the normal blocks
can't:

1. Paste an embed code (the `<iframe>…` snippet sites give you under
   "Share → Embed") — or write your own HTML. Inline CSS (`style="…"`) works,
   so you can style it freely.
2. Press **Apply** to see the preview. **Edit** brings the code back.

The preview is exactly what readers will see. For safety, scripts are removed
automatically, and iframe embeds only work from **YouTube, Vimeo, Spotify and
Google Maps** — embeds from other sites are silently dropped.

## 9. Call to action

Type **`/cta`** to drop in a promo card — the same card design the marketing
pages use, but with every part under your control.

The card opens with its form showing. Fill in what you want and leave the rest
blank; **anything you leave empty simply isn't shown**, so a card with no
eyebrow, or no button, just doesn't have one.

| Field                                | What it is                                                              |
| ------------------------------------ | ----------------------------------------------------------------------- |
| Eyebrow                              | Small upper-case line above the heading                                 |
| Heading                              | The big line — the main message                                         |
| Body                                 | A sentence or two underneath                                            |
| Button text + Button link            | The button. **Both** are needed for it to appear                        |
| Image                                | **Choose image** opens the media library; **Remove image** takes it out |
| Image alt text                       | Describes the image (fills in from the library when it has one)         |
| Image on the left / right / No image | Which side the picture sits on                                          |
| In line / Pinned to top / bottom     | How the picture sits in its column — see below                          |

Click **Done** when you're finished and the form folds away, leaving the card
exactly as readers will see it. Click **Edit** to change it again.

The **Button link** can be an internal path (`/download`, `/solar`) or a full
external address. Internal links stay in the same tab; external ones open in a
new tab automatically.

> **A note on the heading:** it looks like a heading but deliberately isn't
> one — it stays out of the table of contents and out of the article's heading
> structure, so an advert never gets counted as part of the article's outline.

**Pinning the image.** *In line with the text* is the normal setting — the
picture is centred against the copy. *Pinned to the top / bottom edge* lifts it
out and stands it against that edge of the card, so a tall image (a phone
mockup, say) touches the border instead of floating in the middle. It's the
look the app-download card on the homepage uses.

The column stays the same width either way, so the text never runs underneath,
and a pinned image is never allowed to grow taller than the card. Pinning is
ignored when there's no image, or when the side is set to **No image**.

On narrow screens the image moves above the text and the card centres itself,
whichever side you picked — and pinning is ignored there too, since a stacked
card has no side column to pin against.

## 10. Side-by-side columns

- Type **`/columns`** and pick **Two** or **Three Columns**, **or** drag a
  block to the **left/right edge** of another block until it snaps in beside it.
- Drag the gap between columns to change their widths.
- Drag a block out of a column to dissolve it.
- On phones, columns stack on top of each other automatically.

## 11. Moving & organising blocks

- Hover a block → **⠿ drag handle** appears on the left. Drag it to move the
  block; click it for actions (delete, duplicate, colours…).
- **Tab / Shift+Tab** nests / un-nests list items.
- **Tables:** type `/table`. Click into cells to type; hover the edges for
  **+** buttons and handles to add, move or delete rows and columns.

## 12. The URL (slug)

The **Slug** field in _Post details_ is the article's address —
`/hive/your-slug`. It is **required** and no longer follows the title, so it
is yours to choose:

- **Generate** fills it in from the title in one click; edit it freely after.
- On a new post, **Start draft** appears once the slug is free — that is what
  brings the post into existence, and nothing is saved before you press it.
- It's checked as you type: **Available**, or which post already uses it —
  including **drafts**, which the check used to miss.
- Saving is blocked on a clash rather than quietly renaming it, so you get the
  URL you chose or a clear reason why not.

> **Careful with published posts:** changing the slug of a live article breaks
> its existing URL — old links and search results will 404. Only change it if
> you mean to.

## 13. Saving & publishing

### The post saves itself

Set the slug, then press **Start draft** (beside the Generate button). That
creates the post — keeping everything you have written so far — and from then
on your work is saved for you a few seconds after you stop typing. The line
beside the status chip tells you where you are: *Unsaved changes* → *Saving…*
→ *Saved*.

The button appears only until the post exists; after that there is nothing for
it to do. Until you press it, nothing has been saved anywhere.

Autosave covers everything on the page bar the two exceptions below: the
**title and body**, the **post details** (description, lede, byline date), the
**author, category and tags**, the **cover image** and its alt/title/caption/
credit, the **SEO and social** fields, the **CTA**, and the carousel and
featured settings.

The author, category and tags are kept too.

Two things are **not** autosaved, on purpose:

| Not autosaved | Why |
| --- | --- |
| The **slug** and which blog it's in | Moving a published post leaves a redirect behind at its old URL — a decision, not a keystroke |
| **Publish / Unpublish / Archive** | Autosave can't change whether a post is live, by design |

> **It never publishes anything.** Autosave cannot change whether a post is
> live, so you can leave a half-written sentence on screen safely.

### Editing a post that is already live

Your edits are kept **privately** until you say otherwise: readers keep seeing
the published version, and the status line reads *Saved — not live yet*. The
dashboard marks those posts with a **•** beside "Published".

- **Update** — makes everything on the page live, in one go.
- **Discard changes** — throws the unpublished edits away and reloads the live
  version. There is no undo.

Close the tab mid-edit and your work is waiting when you come back: reopening
the post shows what you were writing, not what readers have.

### The buttons

Which ones appear depends on the post:

| Post | Buttons |
| --- | --- |
| New or draft | **Save draft** · **Publish** |
| Published | **Discard changes** (only with pending edits) · **Unpublish** · **Archive** · **Update** |
| Archived | **Save** · **Unarchive** |

> **Saving never changes publication.** *Save draft* on a live post used to
> take it offline; taking a post down is now **Unpublish**, and nothing else
> does it by accident.

**Preview** (in the post list, or the link above the editor) shows what you are
working on — including edits you haven't made live — exactly as a reader would
see it.

Leaving the page with unsaved changes still triggers a browser warning, since
the fields autosave doesn't cover may not have been saved yet.

---

### Quick tips

- Structure with **Heading 2/3** — they power the table of contents.
- **Reuse** media via `/media` instead of uploading the same file twice.
- **Alt text on every image** — the post won't save without it. Captions are
  optional; add one only when it tells the reader something extra.
- Link to our own articles with **Link to page** rather than pasting URLs —
  it can't produce a typo'd or draft link.
- Use **FAQ questions** for genuine Q&A; it's the part search engines can
  surface directly.
- Keep **one idea per block** — easier to reorder and to arrange in columns.
