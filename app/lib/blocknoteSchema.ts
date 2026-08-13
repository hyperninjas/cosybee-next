import {
  addDefaultPropsExternalHTML,
  BlockNoteSchema,
  createBlockConfig,
  createBlockSpec,
  createExtension,
  createToggleWrapper,
  defaultProps,
  createImageBlockConfig,
  createStyleSpec,
  defaultBlockSpecs,
  defaultStyleSpecs,
  imageParse,
  imageRender,
  imageToExternalHTML,
} from "@blocknote/core";
import { withMultiColumn } from "@blocknote/xl-multi-column";
import DOMPurify from "dompurify";
import { createAnchorAssigner } from "./toc";

/**
 * The BlockNote schema shared by the client editor and the server-side
 * HTML renderer. The editor (app/(private)/admin/posts/Editor.tsx) adds
 * BlockNote's official resizable multi-column blocks via `withMultiColumn`,
 * which introduces `column`/`columnList` block types. On top of that we add:
 *
 *  - `linkRel` style: per-link SEO rel qualifiers (nofollow/sponsored/ugc).
 *    BlockNote's link inline content only persists `href` in the document
 *    JSON, so rel can't live on the link itself — instead it's a text STYLE
 *    applied to the link's text (styles DO persist in contentJson). It renders
 *    as a `data-link-rel` marker span; the server export pipeline
 *    (blocknote.ts → decorateArticleLinks) reads the marker and hoists the
 *    tokens onto the parent `<a>`'s `rel` attribute.
 *
 *  - `tableOfContents` block: an author-insertable linked outline of the
 *    article's h2/h3 headings. In the editor it live-previews (and click
 *    scrolls to the heading). The HTML export is an EMPTY placeholder div:
 *    the headless server export can't see sibling blocks, so `buildToc`
 *    (app/lib/toc.ts) fills it with anchors at render time — which also
 *    guarantees its links match the heading ids exactly.
 *
 * The server renderer MUST use this exact same schema — otherwise
 * `blocksToHTMLLossy` can't find the `propSchema` for custom block types and
 * throws "Cannot read properties of undefined (reading 'propSchema')".
 * Vanilla (non-React) specs are used on purpose: they build plain DOM, which
 * works identically in the browser and in server-util's jsdom.
 */

// ── linkRel style ────────────────────────────────────────────────────────

/** Rel tokens an author can toggle per link (space-joined in the style value). */
export const LINK_REL_TOKENS = ["nofollow", "sponsored", "ugc"] as const;
export type LinkRelToken = (typeof LINK_REL_TOKENS)[number];

const linkRelStyle = createStyleSpec(
  { type: "linkRel", propSchema: "string" },
  {
    // Used for BOTH the editor DOM and the external HTML export. The editor
    // shows the tokens as a small ::after badge (globals.css); the export
    // pipeline hoists them onto the parent <a> and strips the attribute.
    render(value) {
      const dom = document.createElement("span");
      dom.setAttribute("data-link-rel", value ?? "");
      return { dom, contentDOM: dom };
    },
  },
);

// ── heading anchors (shared by the TOC block; mirrors buildToc) ──────────

type AnyBlock = {
  id?: string;
  type?: string;
  props?: Record<string, unknown>;
  content?: unknown;
  children?: AnyBlock[];
};

export type HeadingAnchor = {
  /** BlockNote block id — used for click-to-scroll inside the editor. */
  blockId: string;
  /**
   * The anchor id this heading will get on the published page. Predicted
   * with the SAME assigner `buildToc` uses (same texts, same document
   * order → same ids). Lets the editor offer pickable `#anchor` links.
   */
  slug: string;
  text: string;
  level: 2 | 3;
};

/**
 * Concatenate the plain text of a block's inline content (text + links).
 *
 * Stored documents hold an ARRAY of inline-content objects, but BlockNote also
 * accepts a bare string wherever content is written (`insertBlocks`, fixtures,
 * anything hand-authored), and such a block can be handed straight to these
 * walkers. Accepting both costs one line and avoids silently reading an empty
 * question or heading.
 */
function inlineText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  let out = "";
  for (const item of content as Array<Record<string, unknown>>) {
    if (typeof item?.text === "string") out += item.text;
    else if (Array.isArray(item?.content)) out += inlineText(item.content);
  }
  return out;
}

/**
 * Walk a BlockNote document (depth-first, document order — including blocks
 * nested in columns) and return every h2/h3 heading. Used by the editor's
 * live TOC preview; the published anchors come from `buildToc` instead.
 */
export function collectHeadingAnchors(blocks: AnyBlock[]): HeadingAnchor[] {
  const anchors: HeadingAnchor[] = [];
  const assignAnchor = createAnchorAssigner();

  const walk = (list: AnyBlock[] | undefined): void => {
    for (const block of list ?? []) {
      const level = block.props?.["level"];
      if (block.type === "heading" && (level === 2 || level === 3)) {
        const text = inlineText(block.content).replace(/\s+/g, " ").trim();
        if (text) {
          anchors.push({
            blockId: block.id ?? "",
            slug: assignAnchor(text),
            text,
            level,
          });
        }
      }
      walk(block.children);
    }
  };

  walk(blocks);
  return anchors;
}

// ── FAQ extraction (shared by the article's FAQPage JSON-LD) ────────────

export type FaqEntry = { question: string; answer: string };

/** Plain text of a block and everything nested under it, space-joined. */
function blockText(block: AnyBlock): string {
  const parts = [inlineText(block.content)];
  for (const child of block.children ?? []) parts.push(blockText(child));
  return parts.filter(Boolean).join(" ");
}

/**
 * Every question/answer pair in a document, in reading order.
 *
 * Drives the article's FAQPage markup. Derived from the SAME blocks that
 * render the visible accordion, which is what keeps the two in step — Google
 * requires FAQ markup to mirror what a reader can actually see, and the surest
 * way to satisfy that is to have one source rather than two that must agree.
 *
 * A pair needs both halves: a question with no answer yet (a block still being
 * written) is skipped rather than emitted with an empty `acceptedAnswer`.
 */
export function collectFaqItems(contentJson: unknown): FaqEntry[] {
  let data: unknown = contentJson;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return [];
    }
  }
  const root: AnyBlock[] = Array.isArray(data)
    ? (data as AnyBlock[])
    : data && typeof data === "object" && Array.isArray((data as AnyBlock).children)
      ? ((data as AnyBlock).children as AnyBlock[])
      : data && typeof data === "object" && Array.isArray((data as { blocks?: AnyBlock[] }).blocks)
        ? ((data as { blocks: AnyBlock[] }).blocks as AnyBlock[])
        : [];

  const items: FaqEntry[] = [];
  const walk = (blocks: AnyBlock[] | undefined): void => {
    for (const block of blocks ?? []) {
      if (block.type === "faqItem") {
        const question = inlineText(block.content).replace(/\s+/g, " ").trim();
        const answer = (block.children ?? [])
          .map(blockText)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
        if (question && answer) items.push({ question, answer });
        // Don't recurse into a FAQ item: its children ARE the answer, and a
        // nested FAQ block would otherwise be counted twice.
        continue;
      }
      walk(block.children);
    }
  };
  walk(root);
  return items;
}

// ── tableOfContents block ────────────────────────────────────────────────

/** Build the `<p class=…-title> + <ul>` skeleton both renderers share. */
function buildTocDom(
  anchors: HeadingAnchor[],
  className: string,
  makeItem: (anchor: HeadingAnchor) => HTMLElement,
): HTMLElement {
  const dom = document.createElement("div");
  dom.className = className;
  const title = document.createElement("p");
  title.className = `${className}-title`;
  title.textContent = "Contents";
  const list = document.createElement("ul");
  for (const anchor of anchors) {
    const li = document.createElement("li");
    li.setAttribute("data-level", String(anchor.level));
    li.appendChild(makeItem(anchor));
    list.appendChild(li);
  }
  dom.append(title, list);
  return dom;
}

const tableOfContentsBlock = createBlockSpec(
  {
    type: "tableOfContents",
    propSchema: {},
    content: "none",
  },
  {
    /**
     * Editor preview: a live outline rebuilt on every document change.
     * Clicking an entry scrolls the editor to that heading (blocks carry
     * their id as `data-id` in the editor DOM).
     */
    render(_block, editor) {
      const dom = document.createElement("div");
      dom.className = "bn-toc-block";
      dom.contentEditable = "false";

      const build = () => {
        const anchors = collectHeadingAnchors(
          editor.document as unknown as AnyBlock[],
        );
        const inner = buildTocDom(anchors, "bn-toc", (anchor) => {
          const button = document.createElement("button");
          button.type = "button";
          button.textContent = anchor.text;
          button.addEventListener("click", () => {
            document
              .querySelector(`[data-id="${anchor.blockId}"]`)
              ?.scrollIntoView({ behavior: "smooth", block: "center" });
          });
          return button;
        });
        if (anchors.length === 0) {
          const empty = document.createElement("p");
          empty.className = "bn-toc-empty";
          empty.textContent =
            "No headings yet — add level-2/3 headings and they'll appear here.";
          inner.appendChild(empty);
        }
        dom.replaceChildren(inner);
      };

      build();
      const unsubscribe = editor.onChange(() => build());
      return { dom, destroy: () => unsubscribe?.() };
    },

    /**
     * Published HTML: an EMPTY placeholder. The headless server export
     * renders blocks in isolation (editor.document is not populated), so
     * `buildToc` fills this div with heading anchors at render time.
     */
    toExternalHTML() {
      const dom = document.createElement("div");
      dom.className = "article-toc";
      return { dom };
    },
  },
);

// ── htmlBlock (custom HTML / embeds) ─────────────────────────────────────

/**
 * Origins an `<iframe>` may embed from. Anything else — and any non-https
 * src — is removed by the sanitizer. Extend deliberately; every entry is a
 * site we let run inside our pages.
 */
const EMBED_IFRAME_HOSTS = new Set([
  "www.youtube.com",
  "youtube.com",
  "www.youtube-nocookie.com",
  "player.vimeo.com",
  "open.spotify.com",
  "www.google.com",
  "maps.google.com",
]);

// DOMPurify instances are bound to a window: the browser's in the editor,
// server-util's jsdom during HTML export. Created lazily (no window exists
// at module load on the server) and re-created if the window changes.
let purifier: ReturnType<typeof DOMPurify> | null = null;
let purifierWindow: unknown = null;

function getPurifier(): ReturnType<typeof DOMPurify> | null {
  const win = (globalThis as { window?: Window }).window;
  if (!win) return null;
  if (purifier && purifierWindow === win) return purifier;
  purifier = DOMPurify(win as unknown as Parameters<typeof DOMPurify>[0]);
  purifierWindow = win;
  // Enforce the embed allowlist: iframes survive only with an https src on
  // an approved host.
  purifier.addHook("uponSanitizeElement", (node, data) => {
    if (data.tagName !== "iframe") return;
    const src = (node as Element).getAttribute?.("src") ?? "";
    let allowed = false;
    try {
      const url = new URL(src);
      allowed = url.protocol === "https:" && EMBED_IFRAME_HOSTS.has(url.hostname);
    } catch {
      allowed = false;
    }
    if (!allowed) (node as Element).remove();
  });
  return purifier;
}

/**
 * Sanitize author-written HTML for the `htmlBlock`. Runs in BOTH the editor
 * preview and the server export, so what the author sees is exactly what
 * publishes. DOMPurify defaults strip scripts, event handlers and
 * javascript: URLs; inline `style` and the usual formatting/table tags stay,
 * and iframes are restricted to EMBED_IFRAME_HOSTS. Returns "" when no DOM
 * is available (never passes raw input through).
 */
export function sanitizeEmbeddedHtml(html: string): string {
  const p = getPurifier();
  if (!p) return "";
  return p.sanitize(html, {
    ADD_TAGS: ["iframe"],
    ADD_ATTR: [
      "allow",
      "allowfullscreen",
      "frameborder",
      "referrerpolicy",
      "loading",
      "target",
    ],
  });
}

const htmlBlock = createBlockSpec(
  {
    type: "htmlBlock",
    propSchema: { html: { default: "" } },
    content: "none",
  },
  {
    /**
     * Editor: sanitized live preview + a source textarea toggled by an
     * Edit/Apply button. Key events inside the textarea are stopped from
     * propagating so BlockNote's shortcuts don't hijack typing.
     */
    render(block, editor) {
      const dom = document.createElement("div");
      dom.className = "bn-html-block";
      dom.contentEditable = "false";

      const header = document.createElement("div");
      header.className = "bn-html-header";
      const label = document.createElement("span");
      label.className = "bn-html-label";
      label.textContent = "Custom HTML";
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "bn-html-toggle";
      header.append(label, toggle);

      const preview = document.createElement("div");
      preview.className = "bn-html-preview";

      const source = document.createElement("textarea");
      source.className = "bn-html-source";
      source.spellcheck = false;
      source.placeholder =
        "Paste an embed (YouTube, Vimeo, Spotify, Google Maps) or write HTML.\nScripts are stripped; iframes only from the allowed sites.";
      for (const type of ["keydown", "keypress", "keyup", "paste", "copy", "cut", "mousedown"]) {
        source.addEventListener(type, (e) => e.stopPropagation());
      }

      const syncPreview = (html: string) => {
        const clean = sanitizeEmbeddedHtml(html);
        if (clean.trim()) {
          preview.classList.remove("bn-html-preview-empty");
          preview.innerHTML = clean;
        } else {
          preview.classList.add("bn-html-preview-empty");
          preview.textContent = "Empty HTML block — click Edit to add markup.";
        }
      };

      let editing = false;
      const setEditing = (next: boolean) => {
        editing = next;
        toggle.textContent = next ? "Apply" : "Edit";
        source.style.display = next ? "" : "none";
        if (next) setTimeout(() => source.focus());
      };

      toggle.addEventListener("click", () => {
        if (!editing) {
          setEditing(true);
          return;
        }
        // Apply: preview immediately, then persist to the block props (the
        // preview is synced here too in case BlockNote re-mounts the view).
        syncPreview(source.value);
        setEditing(false);
        editor.updateBlock(block, { props: { html: source.value } });
      });

      source.value = block.props.html;
      syncPreview(block.props.html);
      // A freshly inserted (empty) block starts in edit mode.
      setEditing(block.props.html.trim() === "");

      dom.append(header, preview, source);
      return { dom };
    },

    /** Published HTML: the sanitized markup in an `.article-html` wrapper. */
    toExternalHTML(block) {
      const dom = document.createElement("div");
      dom.className = "article-html";
      dom.innerHTML = sanitizeEmbeddedHtml(block.props.html);
      return { dom };
    },
  },
);

// ── image block with real alt text ───────────────────────────────────────

/**
 * BlockNote's stock image block has NO alt field. Both its editor renderer and
 * its HTML export do `img.alt = block.props.name` — the upload FILE NAME — and
 * nothing in the UI can change it. Published articles were therefore shipping
 * `alt="image.png"`, `alt="IMG_5169"` and `alt="Captura de pantalla 2026-07-17
 * a la(s) 18.19.25.png"`, while the genuinely descriptive text sat in the
 * caption. Worse, the alt-text save guard reads `caption`, so every one of
 * those images passed validation as "has alt text".
 *
 * This adds a real `alt` prop and resolves the attribute as
 * `alt → caption → ""`:
 *
 *  - `alt` is what the author typed in the Alt text field (Editor.tsx).
 *  - `caption` is the fallback, which is what makes EVERY existing image
 *    improve with no migration: legacy blocks have no `alt`, so they inherit
 *    their (already descriptive) caption instead of a file name.
 *  - `""` last — an explicitly blank alt marks an image decorative, which is
 *    correct per WCAG H67 and much better than inventing text.
 *
 * The block is composed from BlockNote's own exported pieces
 * (`createImageBlockConfig`, `imageParse`, `imageRender`,
 * `imageToExternalHTML`) rather than reimplemented, so resizing, uploading,
 * the file panel and HTML parsing all keep working exactly as before — we only
 * add one prop and patch the `alt` attribute on the way out.
 */

/** The stock image config plus an `alt` prop. */
const createImageWithAltConfig = createBlockConfig(
  (options: { icon?: string } = {}) => {
    const base = createImageBlockConfig(options);
    return {
      ...base,
      propSchema: {
        ...base.propSchema,
        /** Author-written alt text. Empty = fall back to caption. */
        alt: { default: "" as const },
      },
    } as const;
  },
);

type ImageAltProps = { alt?: string; caption?: string; name?: string };

/** The alt attribute for an image block: author's alt, else its caption. */
function resolveImageAlt(props: ImageAltProps): string {
  return (props.alt || props.caption || "").trim();
}

/**
 * Set `alt` on the `<img>` inside a rendered image block, wherever it sits
 * (the export returns a bare `<img>`, or a `<figure>` wrapping one).
 *
 * Tag-name checks rather than `instanceof HTMLImageElement`: the server export
 * runs inside server-util's jsdom, which supplies a `window` but no DOM
 * constructors on Node's global scope — `instanceof` there throws
 * "HTMLImageElement is not defined" and takes every article render down with
 * it. Same reason this whole file uses vanilla specs.
 *
 * `setAttribute` rather than `.alt =` for the same portability reason, and
 * because an empty alt must still be WRITTEN: a missing alt is an error, an
 * empty one declares the image decorative.
 */
function patchAlt(dom: HTMLElement, alt: string): void {
  const img = dom.tagName === "IMG" ? dom : dom.querySelector?.("img");
  img?.setAttribute("alt", alt);
}

const imageWithAltBlock = createBlockSpec(
  createImageWithAltConfig,
  (options: { icon?: string }) => ({
    meta: { fileBlockAccept: ["image/*"] },

    /**
     * Stock parsing, plus the `alt` of any pasted/imported `<img>` — otherwise
     * pasting HTML would drop alt text the source had already written.
     */
    parse: (element: HTMLElement) => {
      const parsed = imageParse(options)(element);
      if (!parsed) return undefined;
      // Tag check, not `instanceof` — see `patchAlt`.
      const img =
        element.tagName === "IMG" ? element : element.querySelector("img");
      const alt = img?.getAttribute("alt")?.trim();
      return alt ? { ...parsed, alt } : parsed;
    },

    render: (block, editor) => {
      const rendered = imageRender(options)(
        block as Parameters<ReturnType<typeof imageRender>>[0],
        editor as Parameters<ReturnType<typeof imageRender>>[1],
      );
      // Keep the editor preview honest: what a screen reader would announce
      // here is what will publish.
      patchAlt(rendered.dom, resolveImageAlt(block.props));
      return rendered;
    },

    toExternalHTML: (block, editor) => {
      const exported = imageToExternalHTML(options)(
        block as Parameters<ReturnType<typeof imageToExternalHTML>>[0],
        editor as Parameters<ReturnType<typeof imageToExternalHTML>>[1],
      );
      patchAlt(exported.dom, resolveImageAlt(block.props));
      return exported;
    },

    // Same ordering as the stock spec — the generic file block must not claim
    // images first.
    runsBefore: ["file"] as const,
  }),
);

// ── faqItem block ────────────────────────────────────────────────────────

/**
 * A single question/answer pair, rendered as a native `<details>` accordion.
 *
 * WHY A BLOCK PER PAIR, rather than one block holding the whole FAQ (the shape
 * WordPress plugins use): custom blocks here must build VANILLA DOM, because
 * the same spec runs in the browser and in server-util's jsdom. A single
 * container block would therefore need a hand-rolled editor — contenteditable
 * fields with no formatting toolbar — and answers would lose bold, links and
 * lists. One block per pair instead borrows BlockNote's own machinery: the
 * QUESTION is the block's inline content and the ANSWER is its child blocks,
 * so both are ordinary rich text, drag-reorderable, with no bespoke UI at all.
 * Consecutive items are styled into one card by CSS (see globals.css), which
 * recovers the grouped look without the architecture.
 *
 * A distinct type rather than reusing Toggle List, so that
 * `collectFaqItems` can tell "this is a FAQ" from "this is a collapsible
 * outline" — the FAQPage markup would otherwise claim every toggle in the
 * article is a question. Existing toggle lists keep behaving exactly as before.
 *
 * `<details>` is the whole accordion: no JavaScript, keyboard accessible, and
 * the answer stays in the DOM when collapsed — which is what keeps it
 * crawlable, and therefore what makes the FAQPage markup honest.
 */
/**
 * Expanded/collapsed memory for FAQ items in the EDITOR.
 *
 * BlockNote's default remembers the state in localStorage and treats "nothing
 * stored" as COLLAPSED — which is right for a toggle list you are re-opening,
 * and wrong for a block you just created: a new FAQ item appeared already
 * folded shut, so pressing Enter moved the caret into an answer nobody could
 * see. Here a missing entry means EXPANDED; only an explicit collapse is
 * remembered.
 *
 * Keyed under `faq-` rather than BlockNote's `toggle-`, so a block that has
 * been converted between the two types doesn't inherit the other's state.
 * Guarded for the absence of `window`: this only ever runs in the editor, but
 * the module is also imported by the server renderer.
 */
const faqToggledState = {
  set: (block: { id: string }, isToggled: boolean) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(`faq-${block.id}`, isToggled ? "true" : "false");
  },
  get: (block: { id: string }) => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(`faq-${block.id}`) !== "false";
  },
};

const faqItemBlock = createBlockSpec(
  createBlockConfig(
    () =>
      ({
        type: "faqItem" as const,
        propSchema: { ...defaultProps },
        content: "inline" as const,
      }) as const,
  ),
  {
    meta: { isolating: false },

    /** Editor: BlockNote's own collapsible wrapper, so it behaves like a toggle. */
    render(block, editor) {
      const question = document.createElement("p");
      const wrapper = createToggleWrapper(
        block as Parameters<typeof createToggleWrapper>[0],
        editor,
        question,
        // Default to expanded — see `faqToggledState`.
        faqToggledState as Parameters<typeof createToggleWrapper>[3],
      );
      return { ...wrapper, contentDOM: question };
    },

    /**
     * Published: `<details>` with the question in `<summary>` and the answer
     * blocks in a wrapper div.
     *
     * Deliberately NOT `open`: an FAQ reads as a list of questions you expand,
     * which is also how the site's marketing accordion behaves. Collapsed
     * `<details>` still carries its content in the DOM, so nothing is hidden
     * from crawlers.
     */
    toExternalHTML(block) {
      const details = document.createElement("details");
      details.className = "article-faq";

      const summary = document.createElement("summary");
      summary.className = "article-faq-q";
      const question = document.createElement("p");
      summary.appendChild(question);

      const answer = document.createElement("div");
      answer.className = "article-faq-a";

      details.append(summary, answer);
      addDefaultPropsExternalHTML(block.props, details);

      return { dom: details, contentDOM: question, childrenDOM: answer };
    },
  },
  [
    createExtension({
      key: "faq-item-shortcuts",
      keyboardShortcuts: {
        /**
         * Enter on the question moves into the ANSWER, rather than creating a
         * sibling block after the whole FAQ item.
         *
         * Without this the block inherits the default behaviour — Enter makes
         * a new block *after* the card — which reads as the cursor escaping
         * the question you were mid-way through answering. A question and its
         * answer are one thought, so Enter should continue it.
         *
         * The answer is created on demand: a FAQ item whose answer was
         * deleted still takes you somewhere sensible instead of doing nothing.
         * Adding the child also makes the toggle wrapper reveal its children,
         * so the caret can never land somewhere collapsed.
         */
        Enter: ({ editor }) => {
          const { block } = editor.getTextCursorPosition();
          if (block.type !== "faqItem") return false;

          const existing = editor.getBlock(block.id);
          const firstAnswer = existing?.children?.[0];
          if (firstAnswer) {
            editor.setTextCursorPosition(firstAnswer.id, "end");
            return true;
          }

          const updated = editor.updateBlock(block, {
            children: [{ type: "paragraph" }],
          });
          const created = updated.children?.[0];
          if (created) editor.setTextCursorPosition(created.id, "end");
          return true;
        },
      },
    }),
  ],
);

// ── schema ───────────────────────────────────────────────────────────────

export const blockNoteSchema = withMultiColumn(
  BlockNoteSchema.create({
    blockSpecs: {
      ...defaultBlockSpecs,
      // Replaces the stock `image` block with the alt-aware one above. Same
      // block type and same props plus `alt`, so existing documents keep
      // loading unchanged — they simply pick up the "" default.
      image: imageWithAltBlock(),
      faqItem: faqItemBlock(),
      tableOfContents: tableOfContentsBlock(),
      htmlBlock: htmlBlock(),
    },
    styleSpecs: {
      ...defaultStyleSpecs,
      linkRel: linkRelStyle,
    },
  }),
);
