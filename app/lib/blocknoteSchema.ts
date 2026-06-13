import { BlockNoteSchema } from "@blocknote/core";
import { withMultiColumn } from "@blocknote/xl-multi-column";

/**
 * The BlockNote schema shared by the client editor and the server-side
 * HTML renderer. The editor (app/(private)/admin/posts/Editor.tsx) adds
 * BlockNote's official resizable multi-column blocks via `withMultiColumn`,
 * which introduces `column`/`columnList` block types.
 *
 * The server renderer MUST use the exact same schema — otherwise
 * `blocksToFullHTML` can't find the `propSchema` for those custom block
 * types and throws "Cannot read properties of undefined (reading 'propSchema')".
 */
export const blockNoteSchema = withMultiColumn(BlockNoteSchema.create());
