"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import {
  useCreateBlockNote,
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import {
  combineByGroup,
  filterSuggestionItems,
  type PartialBlock,
} from "@blocknote/core";
import { en } from "@blocknote/core/locales";
import {
  multiColumnDropCursor,
  getMultiColumnSlashMenuItems,
  locales as multiColumnLocales,
} from "@blocknote/xl-multi-column";
import { uploadFile, validate } from "@/app/lib/storage";
import { blockNoteSchema as schema } from "@/app/lib/blocknoteSchema";

type SchemaPartialBlock = typeof schema.PartialBlock;

type Props = {
  /** Initial document (parsed from Post.contentJson). */
  initialContent?: PartialBlock[];
  /** Called with the full document on every edit. */
  onChange: (blocks: PartialBlock[]) => void;
};

/**
 * The BlockNote (Mantine) WYSIWYG editor. Loaded client-only via
 * next/dynamic (BlockNote relies on browser APIs and can't SSR).
 * Images dropped/added inside the article upload directly to S3
 * via the storage module's presigned URL flow.
 *
 * Multi-column support comes from @blocknote/xl-multi-column: the schema gains
 * `column`/`columnList` blocks, the drop cursor handles edge-drops to create
 * columns, and the slash menu exposes "Two/Three columns". Public Props stay
 * typed against the default `PartialBlock` (PostForm only round-trips the
 * document as JSON), so the schema-specific blocks are cast at the boundaries.
 */
export default function Editor({ initialContent, onChange }: Props) {
  const editor = useCreateBlockNote({
    schema,
    dropCursor: multiColumnDropCursor,
    dictionary: {
      ...en,
      multi_column: multiColumnLocales.en,
    },
    initialContent: initialContent?.length
      ? (initialContent as unknown as SchemaPartialBlock[])
      : undefined,
    uploadFile: async (file: File) => {
      // Validate before upload
      const error = validate(file, "blog-content-image");
      if (error) throw new Error(error);

      // Upload to S3 and return the public URL
      const result = await uploadFile(file, "blog-content-image");
      if (!result.fileUrl) throw new Error("Upload failed - no URL returned");
      return result.fileUrl;
    },
  });

  return (
    <BlockNoteView
      editor={editor}
      theme="light"
      onChange={() => onChange(editor.document as unknown as PartialBlock[])}
      slashMenu={false}
    >
      <SuggestionMenuController
        triggerCharacter="/"
        getItems={async (query) =>
          filterSuggestionItems(
            combineByGroup(
              getDefaultReactSlashMenuItems(editor),
              getMultiColumnSlashMenuItems(editor),
            ),
            query,
          )
        }
      />
    </BlockNoteView>
  );
}
