import {
  BlockNoteSchema,
  createBlockSpec,
  createStyleSpec,
  defaultBlockSpecs,
  defaultStyleSpecs,
} from "@blocknote/core";
import { withMultiColumn } from "@blocknote/xl-multi-column";

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
  text: string;
  level: 2 | 3;
};

/** Concatenate the plain text of a block's inline content (text + links). */
function inlineText(content: unknown): string {
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

  const walk = (list: AnyBlock[] | undefined): void => {
    for (const block of list ?? []) {
      const level = block.props?.["level"];
      if (block.type === "heading" && (level === 2 || level === 3)) {
        const text = inlineText(block.content).replace(/\s+/g, " ").trim();
        if (text) anchors.push({ blockId: block.id ?? "", text, level });
      }
      walk(block.children);
    }
  };

  walk(blocks);
  return anchors;
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

// ── schema ───────────────────────────────────────────────────────────────

export const blockNoteSchema = withMultiColumn(
  BlockNoteSchema.create({
    blockSpecs: {
      ...defaultBlockSpecs,
      tableOfContents: tableOfContentsBlock(),
    },
    styleSpecs: {
      ...defaultStyleSpecs,
      linkRel: linkRelStyle,
    },
  }),
);
