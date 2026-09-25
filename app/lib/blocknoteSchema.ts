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
  propsToAttributes,
} from "@blocknote/core";
import type { Node as TiptapNode } from "@tiptap/core";
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

// ── ctaBlock (customisable call-to-action card) ──────────────────────────

/** Where the image sits relative to the copy. */
const CTA_IMAGE_POSITIONS = ["left", "right", "none"] as const;

/**
 * How the image is anchored in its column.
 *
 * `"none"` keeps it in normal flow, centred against the copy. `"top"` and
 * `"bottom"` lift it OUT of flow and pin it to that edge of the card — the
 * trick the marketing ReadyToReduce card uses to stand its phone mockup on
 * the card's bottom edge. The column stays open at its usual width either
 * way, so the copy never slides underneath.
 */
const CTA_IMAGE_ANCHORS = ["none", "top", "bottom"] as const;

type CtaProps = {
  eyebrow: string;
  heading: string;
  body: string;
  buttonLabel: string;
  buttonHref: string;
  imageUrl: string;
  imageAlt: string;
  imagePosition: string;
  imageAnchor: string;
};

/**
 * Build the CTA card's DOM.
 *
 * ONE builder for both the editor preview and the published export, so the
 * card an author arranges is the card that ships — the two cannot drift into
 * looking different. Plain elements and class names only: the published
 * article body is injected as an HTML string, so it can host no React and no
 * `next/image`, and this same code runs in server-util's jsdom during export.
 *
 * Empty fields are omitted rather than rendered blank, so a card with no
 * eyebrow or no button simply doesn't have one.
 */
function buildCtaDom(props: CtaProps): HTMLElement {
  const position = CTA_IMAGE_POSITIONS.includes(
    props.imagePosition as (typeof CTA_IMAGE_POSITIONS)[number],
  )
    ? props.imagePosition
    : "left";

  const anchor = CTA_IMAGE_ANCHORS.includes(
    props.imageAnchor as (typeof CTA_IMAGE_ANCHORS)[number],
  )
    ? props.imageAnchor
    : "none";

  const card = document.createElement("div");
  card.className = "article-cta";
  card.setAttribute("data-image", props.imageUrl ? position : "none");
  // Only meaningful while there IS an image in a side column.
  card.setAttribute(
    "data-anchor",
    props.imageUrl && position !== "none" ? anchor : "none",
  );

  if (props.imageUrl && position !== "none") {
    const figure = document.createElement("div");
    figure.className = "article-cta-media";
    const img = document.createElement("img");
    img.setAttribute("src", props.imageUrl);
    // Alt is required on content images; an empty one marks it decorative,
    // which is the honest default for a CTA illustration.
    img.setAttribute("alt", props.imageAlt || "");
    img.setAttribute("loading", "lazy");
    figure.appendChild(img);
    card.appendChild(figure);
  }

  const copy = document.createElement("div");
  copy.className = "article-cta-copy";

  if (props.eyebrow) {
    const eyebrow = document.createElement("p");
    eyebrow.className = "article-cta-eyebrow";
    eyebrow.textContent = props.eyebrow;
    copy.appendChild(eyebrow);
  }
  if (props.heading) {
    // A <p>, not a heading: this is an advert inside an article, and letting
    // it into the outline would put "Download the app" in the table of
    // contents and in the document's heading structure.
    const heading = document.createElement("p");
    heading.className = "article-cta-heading";
    heading.textContent = props.heading;
    copy.appendChild(heading);
  }
  if (props.body) {
    const body = document.createElement("p");
    body.className = "article-cta-body";
    body.textContent = props.body;
    copy.appendChild(body);
  }
  if (props.buttonLabel && props.buttonHref) {
    const actions = document.createElement("div");
    actions.className = "article-cta-actions";
    const link = document.createElement("a");
    link.className = "article-cta-button";
    link.setAttribute("href", props.buttonHref);
    link.textContent = props.buttonLabel;
    actions.appendChild(link);
    copy.appendChild(actions);
  }

  card.appendChild(copy);
  return card;
}

/** One labelled field in the editor's CTA form. */
function ctaField(
  label: string,
  value: string,
  onInput: (next: string) => void,
  options: { multiline?: boolean; placeholder?: string } = {},
): HTMLElement {
  const wrap = document.createElement("label");
  wrap.className = "bn-cta-field";
  const name = document.createElement("span");
  name.textContent = label;
  const input = document.createElement(
    options.multiline ? "textarea" : "input",
  ) as HTMLInputElement | HTMLTextAreaElement;
  input.value = value;
  if (options.placeholder) input.placeholder = options.placeholder;
  if (options.multiline) (input as HTMLTextAreaElement).rows = 3;
  // BlockNote listens for keys on the editor root; without this, typing in a
  // field triggers its shortcuts (Enter splits a block, "/" opens the menu).
  for (const type of ["keydown", "keypress", "keyup", "paste", "cut", "mousedown"]) {
    input.addEventListener(type, (e) => e.stopPropagation());
  }
  // Typing only ever repaints the preview. Writing back to the document is
  // deliberately NOT done here — see the block's `persist` for why.
  input.addEventListener("input", () => onInput(input.value));
  wrap.append(name, input);
  return wrap;
}

/**
 * Whether each CTA's edit form is open, keyed by block id.
 *
 * Lives OUTSIDE the block because `editor.updateBlock` tears the node view
 * down and builds a new one: without this, every save snapped the form shut
 * and the author had to click Edit again to carry on.
 */
const ctaFormOpen = new Map<string, boolean>();

/**
 * One `<select>` in the editor's CTA form.
 *
 * `mousedown` is stopped for the same reason the text fields stop keys:
 * BlockNote treats a mousedown inside the block as a click on the block and
 * would steal the selection before the dropdown ever opens.
 */
function ctaSelect(
  ariaLabel: string,
  options: ReadonlyArray<{ value: string; label: string }>,
  selected: string,
  onChange: (next: string) => void,
): HTMLSelectElement {
  const select = document.createElement("select");
  select.className = "bn-cta-select";
  select.setAttribute("aria-label", ariaLabel);
  for (const option of options) {
    const el = document.createElement("option");
    el.value = option.value;
    el.textContent = option.label;
    if (option.value === selected) el.selected = true;
    select.appendChild(el);
  }
  select.addEventListener("mousedown", (e) => e.stopPropagation());
  select.addEventListener("change", () => onChange(select.value));
  return select;
}

/**
 * Event the block fires to ask the React layer to open the media library.
 * A block spec is vanilla DOM and cannot mount the picker itself, so it
 * announces the request and Editor.tsx listens (see MEDIA_PICK_EVENT there).
 */
export const CTA_PICK_IMAGE_EVENT = "energiebee:cta-pick-image";

const ctaBlock = createBlockSpec(
  {
    type: "cta",
    propSchema: {
      eyebrow: { default: "" },
      heading: { default: "" },
      body: { default: "" },
      buttonLabel: { default: "" },
      buttonHref: { default: "" },
      imageUrl: { default: "" },
      imageAlt: { default: "" },
      imagePosition: { default: "left" },
      imageAnchor: { default: "none" },
    },
    content: "none",
  },
  {
    /**
     * Editor: the finished card, with a form underneath for editing it.
     * Same toggle shape as the Custom HTML block, so the two behave alike.
     */
    render(block, editor) {
      const dom = document.createElement("div");
      dom.className = "bn-cta-block";
      dom.contentEditable = "false";

      const header = document.createElement("div");
      header.className = "bn-cta-header";
      const label = document.createElement("span");
      label.className = "bn-cta-label";
      label.textContent = "Call to action";
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "bn-cta-toggle";
      header.append(label, toggle);

      const preview = document.createElement("div");
      preview.className = "bn-cta-preview";

      const form = document.createElement("div");
      form.className = "bn-cta-form";

      /** Current values, mirrored so a field edit doesn't lose the others. */
      const draft: CtaProps = {
        eyebrow: block.props.eyebrow,
        heading: block.props.heading,
        body: block.props.body,
        buttonLabel: block.props.buttonLabel,
        buttonHref: block.props.buttonHref,
        imageUrl: block.props.imageUrl,
        imageAlt: block.props.imageAlt,
        imagePosition: block.props.imagePosition,
        imageAnchor: block.props.imageAnchor,
      };

      const renderPreview = () => {
        preview.replaceChildren(buildCtaDom(draft));
      };

      /**
       * Write the draft back to the document.
       *
       * This RE-MOUNTS the block: BlockNote rebuilds the node view from
       * scratch whenever a prop changes, because a vanilla DOM tree can't be
       * diffed. So every call throws away the very inputs the author is using
       * — which is why it must never fire while they are still in the form.
       * `dirty` keeps it to the moments that matter.
       */
      let dirty = false;
      const persist = () => {
        if (!dirty) return;
        dirty = false;
        editor.updateBlock(block, { props: { ...draft } });
      };

      const set = (key: keyof CtaProps) => (next: string) => {
        draft[key] = next;
        dirty = true;
        renderPreview();
      };

      form.append(
        ctaField("Eyebrow", draft.eyebrow, set("eyebrow"), {
          placeholder: "More time for what matters",
        }),
        ctaField("Heading", draft.heading, set("heading"), {
          placeholder: "Bring clarity to your home energy.",
        }),
        ctaField("Body", draft.body, set("body"), {
          multiline: true,
          placeholder: "One system. One view. Total clarity.",
        }),
        ctaField("Button text", draft.buttonLabel, set("buttonLabel"), {
          placeholder: "Download free app",
        }),
        ctaField("Button link", draft.buttonHref, set("buttonHref"), {
          placeholder: "/download-app",
        }),
        ctaField("Image alt text", draft.imageAlt, set("imageAlt"), {
          placeholder: "Describe the image",
        }),
      );

      // Image controls: pick from the library, drop it, and choose a side.
      const imageRow = document.createElement("div");
      imageRow.className = "bn-cta-image-row";

      const pick = document.createElement("button");
      pick.type = "button";
      pick.className = "bn-cta-action";
      pick.textContent = draft.imageUrl ? "Replace image" : "Choose image";
      pick.addEventListener("click", () => {
        // Hand off to React — see CTA_PICK_IMAGE_EVENT.
        document.dispatchEvent(
          new CustomEvent(CTA_PICK_IMAGE_EVENT, {
            detail: { blockId: block.id },
          }),
        );
      });

      const clear = document.createElement("button");
      clear.type = "button";
      clear.className = "bn-cta-action";
      clear.textContent = "Remove image";
      // Nothing to remove until there is an image.
      clear.hidden = !draft.imageUrl;
      clear.addEventListener("click", () => {
        draft.imageUrl = "";
        draft.imageAlt = "";
        dirty = true;
        clear.hidden = true;
        pick.textContent = "Choose image";
        renderPreview();
      });

      const side = ctaSelect(
        "Image side",
        CTA_IMAGE_POSITIONS.map((value) => ({
          value,
          label: value === "none" ? "No image" : `Image on the ${value}`,
        })),
        draft.imagePosition,
        (next) => {
          draft.imagePosition = next;
          dirty = true;
          renderPreview();
        },
      );

      const anchor = ctaSelect(
        "Image anchor",
        [
          { value: "none", label: "In line with the text" },
          { value: "top", label: "Pinned to the top edge" },
          { value: "bottom", label: "Pinned to the bottom edge" },
        ],
        draft.imageAnchor,
        (next) => {
          draft.imageAnchor = next;
          dirty = true;
          renderPreview();
        },
      );

      imageRow.append(pick, clear, side, anchor);
      form.appendChild(imageRow);

      // Moving BETWEEN fields must not save — saving re-mounts the block, and
      // the field being clicked into would be destroyed underneath the cursor.
      // So the trigger is focus leaving the card altogether: clicking another
      // block, tabbing out, or the media modal taking focus (it portals
      // outside this DOM, so opening it flushes pending edits first — which is
      // what stops a picked image from landing on a stale draft).
      dom.addEventListener("focusout", (event) => {
        const next = (event as FocusEvent).relatedTarget;
        if (next instanceof Node && dom.contains(next)) return;
        persist();
      });

      let editing = false;
      const setEditing = (next: boolean) => {
        editing = next;
        ctaFormOpen.set(block.id, next);
        toggle.textContent = next ? "Done" : "Edit";
        form.style.display = next ? "" : "none";
      };
      toggle.addEventListener("click", () => {
        const next = !editing;
        setEditing(next);
        // Done is an explicit "I'm finished" — flush without waiting for focus
        // to wander off.
        if (!next) persist();
      });

      renderPreview();
      // Reopen exactly as the author left it. Only a card never seen before
      // falls back to "open if there's nothing to show yet".
      setEditing(ctaFormOpen.get(block.id) ?? (!draft.heading && !draft.body));

      dom.append(header, preview, form);
      return { dom };
    },

    /** Published: the same card, built by the same function. */
    toExternalHTML(block) {
      return { dom: buildCtaDom(block.props as CtaProps) };
    },
  },
);

// ── per-block spacing ────────────────────────────────────────────────────

/**
 * Per-block margin/padding overrides, set from the block's drag-handle menu
 * (Editor.tsx → SpacingDialog).
 *
 * Every prop defaults to `""`, which means "not set": no inline style is
 * written and the block keeps the stylesheet's spacing (`.article-body` in
 * globals.css). So every existing document renders exactly as before, and an
 * author only overrides the sides they actually fill in.
 *
 * Values are stored as bare pixel numbers ("24"), never raw CSS: they are
 * parsed and range-checked on the way out (`spacingDeclarations`), so a
 * hand-edited contentJson cannot smuggle arbitrary CSS into a `style`.
 */
export const SPACING_PROPS = [
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
] as const;
export type SpacingProp = (typeof SPACING_PROPS)[number];
export type SpacingValues = Partial<Record<SpacingProp, string>>;

/** Accepted range, in px. Negative margins are allowed (pulling a block up
 *  under the one before it is a legitimate layout move); negative padding is
 *  not valid CSS. */
export const SPACING_LIMITS = {
  margin: { min: -200, max: 400 },
  padding: { min: 0, max: 400 },
} as const;

const spacingPropSchema = {
  marginTop: { default: "" as const },
  marginRight: { default: "" as const },
  marginBottom: { default: "" as const },
  marginLeft: { default: "" as const },
  paddingTop: { default: "" as const },
  paddingRight: { default: "" as const },
  paddingBottom: { default: "" as const },
  paddingLeft: { default: "" as const },
};

/** `marginTop` → `margin-top`. */
function cssProperty(prop: SpacingProp): string {
  return prop.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

/**
 * The inline declarations for a block's spacing props, or `[]` when none are
 * set. Anything that isn't a finite number inside `SPACING_LIMITS` is ignored
 * (treated as unset), never passed through.
 */
export function spacingDeclarations(
  props: SpacingValues,
): [property: string, value: string][] {
  const out: [string, string][] = [];
  for (const prop of SPACING_PROPS) {
    const raw = props[prop];
    if (raw === undefined || raw === "") continue;
    const n = Number(raw);
    const limits = prop.startsWith("margin")
      ? SPACING_LIMITS.margin
      : SPACING_LIMITS.padding;
    if (!Number.isFinite(n) || n < limits.min || n > limits.max) continue;
    out.push([cssProperty(prop), `${n}px`]);
  }
  return out;
}

/** Write the spacing onto an element's inline style, keeping what's there.
 *  `style.setProperty` rather than string-building, so an existing declaration
 *  (e.g. an alignment the export already wrote) is merged, not clobbered. */
function applySpacing(el: Element | null | undefined, props: SpacingValues) {
  // Tag/duck check, not `instanceof HTMLElement` — see `patchAlt` (jsdom on
  // the server has no DOM constructors on the global scope).
  const style = (el as HTMLElement | null | undefined)?.style;
  if (!style) return;
  for (const [property, value] of spacingDeclarations(props)) {
    style.setProperty(property, value);
  }
}

/** Like `applySpacing`, but also CLEARS the sides that are unset — for a view
 *  that is updated in place rather than rebuilt, where a removed value would
 *  otherwise linger. */
function syncSpacing(el: HTMLElement, props: SpacingValues) {
  for (const prop of SPACING_PROPS) el.style.removeProperty(cssProperty(prop));
  applySpacing(el, props);
}

/**
 * The table's editor node, with the spacing attributes added.
 *
 * Every other block's node is built by `BlockNoteSchema.create` from its
 * config, but the table ships a prebuilt Tiptap node — so extending the config
 * alone would leave the props with nowhere to live, and `updateBlock` would
 * silently drop them. The node is extended instead.
 *
 * Its view (`BlockNoteTableView`) is also special: it is kept alive across
 * updates so column resizing works, and its `update` re-applies only the
 * table's own props. So the spacing style is re-synced on every update here,
 * or a change would only show after reloading the editor.
 */
function withSpacingNode(node: TiptapNode): TiptapNode {
  return node.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        ...propsToAttributes(spacingPropSchema),
      };
    },
    addNodeView() {
      const parentView = this.parent?.();
      if (!parentView) return null;
      return (viewProps) => {
        const view = parentView(viewProps) as unknown as {
          dom: HTMLElement;
          update?: (...args: unknown[]) => boolean;
        };
        syncSpacing(view.dom, viewProps.node.attrs as SpacingValues);
        const update = view.update?.bind(view);
        if (update) {
          view.update = (...args: unknown[]) => {
            const ok = update(...args);
            if (ok) {
              syncSpacing(
                view.dom,
                (args[0] as { attrs: SpacingValues }).attrs,
              );
            }
            return ok;
          };
        }
        return view as never;
      };
    },
  });
}

/** The `data-*` names `propsToAttributes` renders for the spacing props. A
 *  literal list, not a `.map` at module load (see the React Compiler note in
 *  the project memory — this module is also bundled for the editor). */
const SPACING_DATA_ATTRS = [
  "data-margin-top",
  "data-margin-right",
  "data-margin-bottom",
  "data-margin-left",
  "data-padding-top",
  "data-padding-right",
  "data-padding-bottom",
  "data-padding-left",
];

// ── resized media width ──────────────────────────────────────────────────

/**
 * How wide a resized image/video publishes.
 *
 * BlockNote stores a resize as `previewWidth` in PIXELS — pixels of the editor
 * the author dragged in. Published as-is (the stock export writes it as the
 * `width` attribute), it only matches the editor while the page column is as
 * wide as the editor's. It isn't on a phone: a 400px image, 60% of the editor,
 * hit the column's `max-width` and went full width, while a 180px image in a
 * column kept its 180px and became a thumbnail once the columns stacked.
 *
 * So the width is published as a PERCENTAGE of the space the author resized
 * it in, which scales with whatever the page gives it. That space is derived
 * from the editor's own geometry (below), and written onto a throwaway copy of
 * the document by `withExportWidths` just before export — the editor never
 * sets `exportWidth`, and an unset one leaves the stock pixel width alone.
 */

/** The editor's writing column: `max-w-2xl` in PostForm.tsx, with the editor's
 *  own inline padding zeroed in globals.css. Keep in step with both. */
const EDITOR_COLUMN_PX = 672;
/** BlockNote's `.bn-block-column` padding: 20px each side, none on the
 *  outermost edges — so 40px between each pair of columns. */
const EDITOR_COLUMN_GUTTER_PX = 40;
/** BlockNote's indent for nested blocks (`.bn-block-group .bn-block-group`). */
const EDITOR_NEST_INDENT_PX = 24;

const mediaWidthPropSchema = {
  /** Export-only: % of the container, set by `withExportWidths`. */
  exportWidth: { default: "" as const },
};

type LooseBlock = {
  type?: string;
  props?: Record<string, unknown>;
  children?: LooseBlock[];
  [key: string]: unknown;
};

/**
 * A copy of `blocks` with `exportWidth` filled in on every resized media
 * block: its `previewWidth` as a percentage of the editor space it sat in —
 * the writing column, a column's share of it, or either less the indent of
 * each nesting level. The input is not modified.
 */
export function withExportWidths<T>(blocks: T[]): T[] {
  const walk = (list: LooseBlock[], containerPx: number): LooseBlock[] =>
    list.map((block) => {
      const next: LooseBlock = { ...block };
      const width = Number(block.props?.previewWidth);
      if (Number.isFinite(width) && width > 0 && containerPx > 0) {
        const pct = Math.min(100, (width / containerPx) * 100);
        next.props = { ...block.props, exportWidth: pct.toFixed(2) };
      }
      if (block.type === "columnList" && block.children?.length) {
        // `flex: 1` columns with padding: the padding comes off first, then
        // the rest is shared by each column's `width` ratio (default 1).
        const ratios = block.children.map((c) => {
          const w = Number(c.props?.width);
          return Number.isFinite(w) && w > 0 ? w : 1;
        });
        const total = ratios.reduce((a, b) => a + b, 0);
        const free =
          containerPx - EDITOR_COLUMN_GUTTER_PX * (block.children.length - 1);
        next.children = block.children.map((column, i) => ({
          ...column,
          children: walk(column.children ?? [], (free * ratios[i]) / total),
        }));
      } else if (block.children?.length) {
        next.children = walk(
          block.children,
          containerPx - EDITOR_NEST_INDENT_PX,
        );
      }
      return next;
    });
  return walk(blocks as LooseBlock[], EDITOR_COLUMN_PX) as T[];
}

/**
 * Publish `exportWidth` on the exported media element. A captioned block is a
 * <figure> — the percentage goes on it (so the caption wraps to the same
 * width, see `figure[data-url]` in globals.css) and the media fills it; a bare
 * <img>/<video> takes it directly. A file shown as a link has neither and is
 * left alone. Only a sane percentage is ever written.
 */
function applyExportWidth(el: Element | null | undefined, raw: unknown) {
  const pct = Number(raw);
  if (!el || !Number.isFinite(pct) || pct <= 0 || pct > 100) return;
  const target = el as HTMLElement;
  const tag = target.tagName;
  if (tag === "FIGURE") {
    target.style.setProperty("width", `${pct}%`);
    const media = target.querySelector("img, video") as HTMLElement | null;
    media?.style.setProperty("width", "100%");
  } else if (tag === "IMG" || tag === "VIDEO") {
    target.style.setProperty("width", `${pct}%`);
  }
}

/**
 * Give a block spec the spacing props and apply them in both outputs.
 *
 *  - Editor (`render`): on the `.bn-block-content` wrapper, so the author sees
 *    the change while writing.
 *  - Published HTML (`toExternalHTML`): on the element that actually ships.
 *    The lossy export unwraps `.bn-block-content` and keeps only its first
 *    child (copying across `data-*` attributes, but NOT `style`), so the style
 *    has to go on that child. When a block has no `toExternalHTML` the export
 *    falls back to `render`, so this does the same fallback itself — otherwise
 *    the spacing would land on the wrapper and be discarded with it.
 *
 * Works because `BlockNoteSchema.create` builds each block's editor node from
 * `config.propSchema` at schema-creation time: extending the config here is
 * enough for the new props to exist on the node and in contentJson. The table
 * ships a prebuilt node instead, which is extended separately
 * (`withSpacingNode`).
 */
function withSpacing<S extends AnySpec>(spec: S): S {
  const impl = spec.implementation;
  const node = (impl as { node?: TiptapNode }).node;
  // The wrapped implementation must never see the spacing props: BlockNote's
  // own `createBlockSpec` wrapper stamps every prop as a `data-*` attribute by
  // looking it up in the ORIGINAL prop schema, and throws on one it doesn't
  // know. So it gets the block with those props removed.
  // Resizable media (anything with `previewWidth`) also gets `exportWidth`
  // — see `withExportWidths`.
  const resizable = "previewWidth" in (spec.config.propSchema ?? {});
  const inner = (block: SpacedBlock) => {
    const props: Record<string, unknown> = { ...block.props };
    for (const prop of SPACING_PROPS) delete props[prop];
    delete props.exportWidth;
    return { ...block, props };
  };
  return {
    ...spec,
    config: {
      ...spec.config,
      propSchema: {
        ...spec.config.propSchema,
        ...spacingPropSchema,
        ...(resizable ? mediaWidthPropSchema : {}),
      },
    },
    implementation: {
      ...impl,
      ...(node ? { node: withSpacingNode(node) } : {}),
      render(this: unknown, block: SpacedBlock, editor: unknown) {
        const out = impl.render.call(
          this,
          inner(block) as never,
          editor as never,
        );
        applySpacing(out.dom as Element, block.props);
        return out;
      },
      toExternalHTML(
        this: unknown,
        block: SpacedBlock,
        editor: unknown,
        context: unknown,
      ) {
        const out =
          impl.toExternalHTML?.call(
            this,
            inner(block) as never,
            editor as never,
            context as never,
          ) ??
          impl.render.call(
            { ...(this as object), renderType: "dom", props: undefined },
            inner(block) as never,
            editor as never,
          );
        if (!out) return out;
        const dom = out.dom as HTMLElement;
        // The table's export renders its node attributes as `data-*` on the
        // wrapper, which the exporter would copy onto the <table>. The inline
        // style below is the published form; the raw values stay in
        // contentJson only.
        for (const attr of SPACING_DATA_ATTRS) dom.removeAttribute?.(attr);
        const published = dom.classList?.contains("bn-block-content")
          ? dom.firstElementChild
          : dom;
        applySpacing(published, block.props);
        if (resizable) applyExportWidth(published, block.props.exportWidth);
        return out;
      },
    },
  } as S;
}

type SpacedBlock = { props: SpacingValues & { exportWidth?: unknown } };
// Loose on purpose: the block specs differ in every type parameter, and the
// wrapper only touches `render`/`toExternalHTML` and the prop schema.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySpec = { config: any; implementation: any; extensions?: any };

/** The schema-level type of `withSpacing(spec)`: same spec, plus the props. */
type Spaced<S> = S extends { config: infer C }
  ? Omit<S, "config"> & {
      config: Omit<C, "propSchema"> & {
        propSchema: (C extends { propSchema: infer P } ? P : never) &
          typeof spacingPropSchema;
      };
    }
  : S;

/** `withSpacing` over a whole spec map. */
function withSpacingAll<T extends Record<string, AnySpec>>(
  specs: T,
): { [K in keyof T]: Spaced<T[K]> } {
  return Object.fromEntries(
    Object.entries(specs).map(([k, s]) => [k, withSpacing(s)]),
  ) as never;
}

// ── schema ───────────────────────────────────────────────────────────────

export const blockNoteSchema = withMultiColumn(
  BlockNoteSchema.create({
    // Every block gets the optional spacing props — see
    // `withSpacing`. Unset spacing leaves a block exactly as it was.
    blockSpecs: withSpacingAll({
      ...defaultBlockSpecs,
      // Replaces the stock `image` block with the alt-aware one above. Same
      // block type and same props plus `alt`, so existing documents keep
      // loading unchanged — they simply pick up the "" default.
      image: imageWithAltBlock(),
      faqItem: faqItemBlock(),
      cta: ctaBlock(),
      tableOfContents: tableOfContentsBlock(),
      htmlBlock: htmlBlock(),
    }),
    styleSpecs: {
      ...defaultStyleSpecs,
      linkRel: linkRelStyle,
    },
  }),
);
