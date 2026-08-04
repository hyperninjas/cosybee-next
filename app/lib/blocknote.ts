import "server-only";
import { ServerBlockNoteEditor } from "@blocknote/server-util";
import type { PartialBlock } from "@blocknote/core";
import { blockNoteSchema, LINK_REL_TOKENS } from "./blocknoteSchema";
import { PRODUCTION_URL, SITE_URL } from "./site";

/** Is this href off-site? Relative paths, #anchors, mailto/tel and our own
 *  origin(s) are "internal"; only absolute http(s) URLs elsewhere are not. */
function isExternalHref(href: string): boolean {
  if (!/^https?:\/\//i.test(href)) return false;
  return !(
    href.startsWith(`${SITE_URL}/`) ||
    href === SITE_URL ||
    href.startsWith(`${PRODUCTION_URL}/`) ||
    href === PRODUCTION_URL
  );
}

/**
 * Rewrite every `<a>` in the exported article HTML with the site's link
 * policy. Two problems this solves:
 *
 *  1. BlockNote's export hardcodes `target="_blank"
 *     rel="noopener noreferrer nofollow"` (plus a junk `classname` attribute)
 *     on EVERY link — so internal article links were nofollow'd and forced
 *     into new tabs on the public site.
 *  2. Author-chosen rel qualifiers live as `data-link-rel` marker spans on
 *     the link text (see the `linkRel` style in blocknoteSchema.ts) and need
 *     hoisting onto the `<a>` itself.
 *
 * Policy: internal links get only the author's tokens (usually none);
 * external links get the author's tokens + `noopener noreferrer` +
 * `target="_blank"`. Marker attributes are stripped afterwards. Safe as
 * string processing: BlockNote can't nest `<a>` elements.
 */
export function decorateArticleLinks(html: string): string {
  // 1. Unwrap marker spans that wrap a link (`<span data-link-rel><a>…</a>
  //    </span>` — the usual nesting, as the linkRel mark sorts outside the
  //    link mark), moving the tokens onto the <a> itself. Spans wrapping
  //    anything other than exactly one link are left for step 2's inner scan.
  let out = html.replace(
    /<span\b[^>]*?data-link-rel="([^"]*)"[^>]*>(<a\b[^>]*>[\s\S]*?<\/a>)<\/span>/g,
    (_m, tokens: string, anchor: string) =>
      anchor.replace(/^<a\b/, `<a data-link-rel="${tokens}"`),
  );

  // 2. Rebuild every <a>'s attributes per the policy, collecting tokens from
  //    the hoisted attribute and from any marker spans still inside.
  out = out.replace(
    /<a\b([^>]*)>([\s\S]*?)<\/a>/g,
    (match, attrs: string, inner: string) => {
      const href = /\bhref="([^"]*)"/.exec(attrs)?.[1];
      if (href === undefined) return match;

      const tokens = new Set<string>();
      for (const m of `${attrs} ${inner}`.matchAll(/data-link-rel="([^"]*)"/g)) {
        for (const t of m[1].split(/\s+/)) {
          if ((LINK_REL_TOKENS as readonly string[]).includes(t)) tokens.add(t);
        }
      }

      const external = isExternalHref(href);
      const rel = [
        ...LINK_REL_TOKENS.filter((t) => tokens.has(t)),
        ...(external ? ["noopener", "noreferrer"] : []),
      ];
      const parts = [`href="${href}"`];
      if (rel.length) parts.push(`rel="${rel.join(" ")}"`);
      if (external) parts.push('target="_blank"');
      // Keep presentational attrs an author may have written in a custom
      // HTML block (BlockNote's own links never carry these — its junk
      // attribute is `classname`, which this intentionally drops).
      for (const kept of attrs.matchAll(/\s(?:class|style|title)="[^"]*"/g)) {
        parts.push(kept[0].trim());
      }
      return `<a ${parts.join(" ")}>${inner}</a>`;
    },
  );

  // 3. The markers' job is done — collapse linkRel marker spans to bare
  //    (inert) <span>s. Scoped to data-style-type="linkRel" so the
  //    data-value attrs of OTHER styles (e.g. text colors) are untouched.
  return out
    .replace(/<span\b[^>]*data-style-type="linkRel"[^>]*>/g, "<span>")
    .replace(/\s*data-link-rel="[^"]*"/g, "");
}

/**
 * Make exported `<video>`/`<audio>` elements actually playable.
 *
 * BlockNote's lossy export emits a bare `<video src="…">` (plus the author's
 * resize `width`) with NO `controls` — in the editor the player chrome comes
 * from BlockNote's own React view, which the public page never loads. Without
 * this the published/preview article shows a dead 300×150 black box that can't
 * be played. `preload="metadata"` fetches just enough for the first frame +
 * duration (not the whole file), and `playsinline` stops iOS Safari from
 * hijacking playback into fullscreen.
 *
 * Attributes are only added when absent, so markup an author wrote by hand in
 * a custom HTML block keeps its own settings.
 */
export function decorateMediaPlayers(html: string): string {
  return html.replace(
    /<(video|audio)\b([^>]*)>/g,
    (match, tag: string, attrs: string) => {
      const add: string[] = [];
      if (!/\bcontrols\b/.test(attrs)) add.push("controls");
      if (!/\bpreload=/.test(attrs)) add.push('preload="metadata"');
      if (tag === "video" && !/\bplaysinline\b/.test(attrs)) {
        add.push("playsinline");
      }
      return add.length ? `<${tag}${attrs} ${add.join(" ")}>` : match;
    },
  );
}

/**
 * Convert BlockNote JSON blocks to HTML string.
 * Uses server-side rendering for generating the HTML.
 *
 * Uses the same schema as the client editor (including multi-column blocks)
 * so custom block types render instead of throwing on a missing propSchema.
 *
 * We use `blocksToHTMLLossy` (not `blocksToFullHTML`) on purpose: it emits
 * clean semantic markup — real `<h2>`/`<p>`/`<ul>`/`<figure>`/`<blockquote>`
 * — which the public `.article-body` prose styles and the TOC heading parser
 * (`buildToc`) both expect. `blocksToFullHTML` instead wraps every block in
 * nested `bn-*` container divs that would require shipping BlockNote's own
 * editor CSS to the public page and would break the prose styling. Multi-column
 * blocks survive the lossy export as `<div class="bn-block-column-list">` with
 * inline `display:flex` / `flex-grow`, so they lay out with no extra CSS (see
 * globals.css for the mobile-stacking rule).
 */
export async function blocksToHtml(blocks: PartialBlock[]): Promise<string> {
  const editor = ServerBlockNoteEditor.create({ schema: blockNoteSchema });
  const html = await editor.blocksToHTMLLossy(blocks);
  // Apply the site link policy (hoist author rel tokens, un-nofollow internal
  // links, external → noopener/new-tab) and give media blocks their player
  // controls before the HTML goes anywhere.
  // Also drop the `data-html` attribute BlockNote's block wrapper stamps on
  // exported htmlBlocks — it duplicates the RAW (unsanitized) source next to
  // the sanitized markup; the raw source belongs only in contentJson.
  return decorateMediaPlayers(decorateArticleLinks(html)).replace(
    /\s*data-html="[^"]*"/g,
    "",
  );
}

/**
 * Parse a JSON string of blocks and convert to HTML.
 * Accepts either an array of blocks or { blocks: [...] } format.
 * Returns empty string if parsing fails.
 */
export async function contentJsonToHtml(contentJson: string | object | unknown[]): Promise<string> {
  try {
    let data = typeof contentJson === "string"
      ? JSON.parse(contentJson)
      : contentJson;

    // Handle { blocks: [...] } format
    if (data && typeof data === "object" && "blocks" in data && Array.isArray((data as { blocks: unknown[] }).blocks)) {
      data = (data as { blocks: unknown[] }).blocks;
    }

    if (!Array.isArray(data)) {
      return "";
    }

    return blocksToHtml(data as PartialBlock[]);
  } catch (e) {
    console.error("Failed to convert contentJson to HTML:", e);
    return "";
  }
}
