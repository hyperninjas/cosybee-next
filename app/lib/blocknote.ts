import { ServerBlockNoteEditor } from "@blocknote/server-util";
import type { PartialBlock } from "@blocknote/core";
import DOMPurify from "isomorphic-dompurify";

// Server-only BlockNote helpers. Used by the seed and by admin Server
// Actions to turn a stored BlockNote document into the sanitized HTML
// the public article page renders — so the editor never ships to the
// public bundle.

/** Parse the JSON we persist in `Post.contentJson` back into blocks. */
export function parseBlocks(contentJson: string): PartialBlock[] {
  try {
    const parsed = JSON.parse(contentJson);
    return Array.isArray(parsed) ? (parsed as PartialBlock[]) : [];
  } catch {
    return [];
  }
}

/**
 * Render BlockNote blocks to clean, sanitized semantic HTML
 * (paragraphs, headings, lists, links, images). `blocksToHTMLLossy`
 * gives plain tags we can style with our own CSS rather than
 * BlockNote's editor classes.
 */
export async function renderBlocksToHtml(
  blocks: PartialBlock[],
): Promise<string> {
  const editor = ServerBlockNoteEditor.create();
  const html = await editor.blocksToHTMLLossy(blocks);
  return DOMPurify.sanitize(html, { ADD_ATTR: ["target", "rel"] });
}

/** Convenience: JSON string -> sanitized HTML. */
export async function contentJsonToHtml(contentJson: string): Promise<string> {
  return renderBlocksToHtml(parseBlocks(contentJson));
}
