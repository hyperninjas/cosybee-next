// Pure read-time estimation from a BlockNote document. No server
// imports, so the admin form can show a live estimate while editing.

const WORDS_PER_MINUTE = 200;

type Inlineish = { text?: string; content?: unknown };
type Blockish = { content?: unknown; text?: string };

/** Recursively pull plain text out of BlockNote inline content. */
function textOf(node: unknown): string {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(textOf).join(" ");
  if (node && typeof node === "object") {
    const n = node as Inlineish;
    const own = typeof n.text === "string" ? n.text : "";
    return `${own} ${n.content ? textOf(n.content) : ""}`;
  }
  return "";
}

/** Count words across all blocks. */
export function countWords(blocks: unknown): number {
  if (!Array.isArray(blocks)) return 0;
  const text = blocks
    .map((b) => textOf((b as Blockish)?.content) + " " + ((b as Blockish)?.text ?? ""))
    .join(" ");
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

/** "N min read", minimum 1, from a parsed blocks array. */
export function estimateReadTime(blocks: unknown): string {
  const minutes = Math.max(1, Math.round(countWords(blocks) / WORDS_PER_MINUTE));
  return `${minutes} min read`;
}

/** Same, but from the JSON string we store/transmit. */
export function estimateReadTimeFromJson(contentJson: string): string {
  try {
    return estimateReadTime(JSON.parse(contentJson));
  } catch {
    return "1 min read";
  }
}

/** All body text as a single whitespace-collapsed string. */
export function plainText(blocks: unknown): string {
  if (!Array.isArray(blocks)) return "";
  return blocks
    .map((b) => textOf((b as Blockish)?.content))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/** A short excerpt drawn from the body — used when no description is set. */
export function excerptFromJson(contentJson: string, max = 180): string {
  let text = "";
  try {
    text = plainText(JSON.parse(contentJson));
  } catch {
    return "";
  }
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  return `${(sp > 40 ? cut.slice(0, sp) : cut).trim()}…`;
}
