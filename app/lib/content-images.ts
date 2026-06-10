/**
 * Walk a BlockNote/TipTap document and find image nodes that are missing
 * alt text. The backend rejects posts with un-alt'd content images
 * (`Content image #N is missing alt text`) — running the same check
 * client-side lets us short-circuit the round-trip and point users at
 * the offending block right in the editor.
 *
 * Shapes we accept (mirrors the server walker):
 *  - BlockNote:  `{ type: "image", props: { url, caption } }`
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

function imageAlt(n: Node): string {
  return (n.alt ?? n.altText ?? n.caption ?? n.props?.caption ?? n.props?.alt ?? n.attrs?.alt ?? "").trim();
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
