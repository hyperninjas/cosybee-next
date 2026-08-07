/**
 * Walk a BlockNote/TipTap document and find image nodes that are missing
 * alt text. The backend rejects posts with un-alt'd content images
 * (`Content image #N is missing alt text`) — running the same check
 * client-side lets us short-circuit the round-trip and point users at
 * the offending block right in the editor.
 *
 * WHAT COUNTS AS ALT, and why the order matters:
 *
 *   1. `props.alt` — the real alt field (see blocknoteSchema.ts). This is the
 *      one authors fill in, and the one that publishes.
 *   2. `props.caption` — the LEGACY fallback. Before images had an alt field,
 *      the caption was the only descriptive text an author could write, and
 *      the renderer falls back to it for exactly that reason. Accepting it
 *      here is what stops every already-published article from failing
 *      validation the moment someone opens it to fix a typo.
 *
 * So caption is now optional (alt alone satisfies the check) while alt is
 * required (in the sense that SOME description must exist) — and no existing
 * document changes status. `props.name` is deliberately NOT accepted: it is
 * the upload file name, and treating it as alt is the bug this guards against.
 *
 * Shapes we accept (mirrors the server walker):
 *  - BlockNote:  `{ type: "image", props: { url, alt, caption } }`
 *  - TipTap:     `{ type: "image", attrs: { src, alt } }`
 *  - Generic:    `{ type: "image", url, alt | altText | caption }`
 *
 * Empty / whitespace-only alt counts as missing.
 */
export interface MissingAlt {
  /** 1-based ordinal of the image as it appears in the document. */
  index: number;
  /** Best-effort source URL for the image — used in error messages. */
  src?: string;
}

type Node = {
  type?: string;
  url?: string;
  alt?: string;
  altText?: string;
  caption?: string;
  props?: { url?: string; caption?: string; alt?: string };
  attrs?: { src?: string; alt?: string };
  children?: unknown[];
  content?: unknown[];
};

function asNode(v: unknown): Node | null {
  return v && typeof v === "object" ? (v as Node) : null;
}

function imageSrc(n: Node): string | undefined {
  return n.url ?? n.props?.url ?? n.attrs?.src;
}

/**
 * First non-blank candidate. Deliberately not `??`: the props carry empty
 * STRINGS rather than undefined (every BlockNote prop has a default), and
 * `??` only falls through on null/undefined — so `caption: ""` would have
 * shadowed a perfectly good `alt` behind it.
 */
function firstNonBlank(...values: (string | undefined)[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function imageAlt(n: Node): string {
  return firstNonBlank(
    n.props?.alt,
    n.alt,
    n.altText,
    n.attrs?.alt,
    // Legacy: caption stood in for alt before the alt field existed.
    n.props?.caption,
    n.caption,
  );
}

function walk(nodes: unknown[], state: { count: number; missing: MissingAlt[] }) {
  for (const raw of nodes) {
    const node = asNode(raw);
    if (!node) continue;
    if (node.type === "image" && imageSrc(node)) {
      state.count++;
      if (!imageAlt(node)) {
        state.missing.push({ index: state.count, src: imageSrc(node) });
      }
    }
    // Recurse into nested block/inline children — BlockNote uses `children`
    // for nested blocks and `content` for inline runs; TipTap uses `content`.
    if (Array.isArray(node.children)) walk(node.children, state);
    if (Array.isArray(node.content)) walk(node.content, state);
  }
}

/** Returns the 1-based ordinals of every image in the document that has no alt. */
export function findContentImagesMissingAlt(
  blocks: unknown[] | { blocks?: unknown[] } | null | undefined,
): MissingAlt[] {
  if (!blocks) return [];
  const root = Array.isArray(blocks) ? blocks : Array.isArray(blocks.blocks) ? blocks.blocks : [];
  const state = { count: 0, missing: [] as MissingAlt[] };
  walk(root, state);
  return state.missing;
}
