"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useRef, useState } from "react";
import {
  useCreateBlockNote,
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
  FormattingToolbar,
  FormattingToolbarController,
  TextAlignButton,
  getFormattingToolbarItems,
  type DefaultReactSuggestionItem,
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
import {
  uploadLibraryFile,
  validateLibraryFile,
  type MediaItem,
} from "@/app/lib/storage";
import { blockNoteSchema as schema } from "@/app/lib/blocknoteSchema";
import { MediaPickerModal } from "@/app/(private)/admin/media/MediaPickerModal";

type SchemaPartialBlock = typeof schema.PartialBlock;

type Props = {
  /** Initial document (parsed from Post.contentJson). */
  initialContent?: PartialBlock[];
  /** Called with the full document on every edit. */
  onChange: (blocks: PartialBlock[]) => void;
};

/** Small image/library icon for the slash menu entry. */
function MediaIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.5-3.5L9 20" />
    </svg>
  );
}

/**
 * Build the BlockNote block to insert for a picked media item, by kind.
 *
 * `"use no memo"` opts this helper out of the React Compiler. Under
 * `compilationMode: "all"` the compiler injects a `useMemoCache` hook into every
 * top-level function; this one is called from an event handler (not during
 * render), so the injected hook would throw "Invalid hook call".
 */
function blockForMedia(media: MediaItem): SchemaPartialBlock {
  "use no memo";
  const url = media.url ?? "";
  const caption = media.alt ?? "";
  if (media.kind === "video") {
    return {
      type: "video",
      props: { url, caption, name: media.name ?? "" },
    } as SchemaPartialBlock;
  }
  if (media.kind === "image") {
    return {
      type: "image",
      props: { url, caption, name: media.name ?? "" },
    } as SchemaPartialBlock;
  }
  // pdf / document → a downloadable file block.
  return {
    type: "file",
    props: { url, caption, name: media.name ?? media.key },
  } as SchemaPartialBlock;
}

/**
 * Formatting toolbar with an extra justify button (the default omits it even
 * though the schema + CSS support it), inserted right after right-align.
 *
 * Used via FormattingToolbarController, with `formattingToolbar={false}` on
 * BlockNoteView so this REPLACES the built-in toolbar rather than stacking a
 * second one over it (two toolbars fight over focus/position and break clicks).
 *
 * `"use no memo"` is a defensive opt-out from the React Compiler
 * (`compilationMode: "all"`) for this app-level render component — same reason
 * as `blockForMedia` elsewhere in this file.
 */
function FormattingToolbarWithJustify() {
  "use no memo";
  const items = [...getFormattingToolbarItems()];
  const justify = (
    <TextAlignButton key="textAlignJustifyButton" textAlignment="justify" />
  );
  const rightIdx = items.findIndex((item) => item.key === "textAlignRightButton");
  if (rightIdx >= 0) items.splice(rightIdx + 1, 0, justify);
  else items.push(justify);
  return <FormattingToolbar>{items}</FormattingToolbar>;
}

/**
 * The BlockNote (Mantine) WYSIWYG editor. Loaded client-only via next/dynamic
 * (BlockNote relies on browser APIs and can't SSR). Images dropped/added inside
 * the article upload directly to S3 via the storage module's presigned flow.
 *
 * A "/Media library" slash command opens a picker over the gallery and inserts
 * the chosen file (image/video/document) as a block — so authors can REUSE
 * library media instead of always uploading new copies.
 *
 * Multi-column support comes from @blocknote/xl-multi-column.
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
      // Validate before upload (images/video/docs — the library allowlist).
      const error = validateLibraryFile(file);
      if (error) throw new Error(error);

      // Route through the media library so dropped/pasted files land in the
      // gallery (with a thumbnail + name) and are usage-tracked against the
      // post, then hand the public URL back to BlockNote for the block.
      const result = await uploadLibraryFile(file);
      if (!result.fileUrl) throw new Error("Upload failed - no URL returned");
      return result.fileUrl;
    },
  });

  const [pickerOpen, setPickerOpen] = useState(false);
  // The block where "/" was typed — we insert the picked media after it.
  const insertAfterRef = useRef<string | null>(null);

  // Custom slash-menu entry that opens the media library picker.
  const mediaSlashItem: DefaultReactSuggestionItem = {
    title: "Media library",
    subtext: "Insert an image, video or file from your library",
    aliases: ["media", "library", "gallery", "asset"],
    group: "Media",
    icon: <MediaIcon />,
    onItemClick: () => {
      insertAfterRef.current = editor.getTextCursorPosition().block.id;
      setPickerOpen(true);
    },
  };

  function handlePick(media: MediaItem) {
    const block = blockForMedia(media);
    const refId =
      insertAfterRef.current ?? editor.getTextCursorPosition().block.id;
    editor.insertBlocks([block], refId, "after");
    // The slash trigger leaves an empty paragraph — drop it so the inserted
    // block takes its place cleanly.
    const ref = editor.getBlock(refId);
    if (
      ref &&
      ref.type === "paragraph" &&
      (ref.content as unknown[]).length === 0
    ) {
      editor.removeBlocks([refId]);
    }
    insertAfterRef.current = null;
  }

  return (
    <>
      <BlockNoteView
        editor={editor}
        theme="light"
        onChange={() => onChange(editor.document as unknown as PartialBlock[])}
        slashMenu={false}
        // Disable the built-in formatting toolbar — we render our own
        // (with a justify button) via FormattingToolbarController below.
        // Without this, BOTH toolbars mount and fight over focus/position,
        // which blurs the editor on click and closes the toolbar.
        formattingToolbar={false}
      >
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={async (query) =>
            filterSuggestionItems(
              combineByGroup(
                getDefaultReactSlashMenuItems(editor),
                getMultiColumnSlashMenuItems(editor),
                [mediaSlashItem],
              ),
              query,
            )
          }
        />
        {/* Adds a justify button alongside the default left/center/right.
            Component is React-Compiler-exempt (see its `"use no memo"`). */}
        <FormattingToolbarController
          formattingToolbar={FormattingToolbarWithJustify}
        />
      </BlockNoteView>

      <MediaPickerModal
        isOpen={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handlePick}
      />
    </>
  );
}
