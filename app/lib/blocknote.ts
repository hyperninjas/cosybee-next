import "server-only";
import { ServerBlockNoteEditor } from "@blocknote/server-util";
import type { PartialBlock } from "@blocknote/core";
import { blockNoteSchema } from "./blocknoteSchema";

/**
 * Convert BlockNote JSON blocks to HTML string.
 * Uses server-side rendering for generating the HTML.
 *
 * Uses the same schema as the client editor (including multi-column blocks)
 * so custom block types render instead of throwing on a missing propSchema.
 */
export async function blocksToHtml(blocks: PartialBlock[]): Promise<string> {
  const editor = ServerBlockNoteEditor.create({ schema: blockNoteSchema });
  const html = await editor.blocksToFullHTML(blocks);
  return html;
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
