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
  LinkToolbarController,
  EditLinkButton,
  OpenLinkButton,
  DeleteLinkButton,
  useComponentsContext,
  useBlockNoteEditor,
  type DefaultReactSuggestionItem,
  type LinkToolbarProps,
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
import { validateLibraryFile, type MediaItem } from "@/app/lib/storage";
import { uploadLibraryMedia } from "@/app/lib/media-upload";
import {
  blockNoteSchema as schema,
  LINK_REL_TOKENS,
  type LinkRelToken,
} from "@/app/lib/blocknoteSchema";
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
  // BlockNote's image/video/file blocks have no separate alt field — `caption`
  // is shown AND used as alt. Pull the richest text the asset has so inserted
  // images arrive already-captioned (and satisfy the "image needs alt" guard).
  const caption = media.caption || media.alt || media.title || "";
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

/** Small list icon for the table-of-contents slash menu entry. */
function TocIcon() {
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
      <path d="M8 6h13" />
      <path d="M10 12h11" />
      <path d="M10 18h11" />
      <path d="M3 6h.01" />
      <path d="M5 12h.01" />
      <path d="M5 18h.01" />
    </svg>
  );
}

type PmRange = { from: number; to: number };

/**
 * Read the linkRel style tokens present anywhere in a document range.
 *
 * `"use no memo"` — called from event handlers/state initializers, not
 * render; see `blockForMedia` for why the compiler must skip it.
 */
function getRelTokens(
  editor: { _tiptapEditor: unknown },
  range: PmRange,
): Set<LinkRelToken> {
  "use no memo";
  const tokens = new Set<LinkRelToken>();
  // The linkRel style is a tiptap mark carrying its value as `stringValue`.
  // BlockNote has no public API to READ styles over an arbitrary range (only
  // the current selection), so inspect the ProseMirror doc directly.
  const { state } = editor._tiptapEditor as {
    state: {
      schema: { marks: Record<string, unknown> };
      doc: {
        nodesBetween: (
          from: number,
          to: number,
          cb: (node: {
            marks: { type: unknown; attrs: { stringValue?: string } }[];
          }) => void,
        ) => void;
      };
    };
  };
  const markType = state.schema.marks["linkRel"];
  if (!markType) return tokens;
  state.doc.nodesBetween(range.from, range.to, (node) => {
    for (const mark of node.marks) {
      if (mark.type !== markType) continue;
      for (const t of (mark.attrs.stringValue ?? "").split(/\s+/)) {
        if ((LINK_REL_TOKENS as readonly string[]).includes(t)) {
          tokens.add(t as LinkRelToken);
        }
      }
    }
  });
  return tokens;
}

/** Replace the linkRel style across a range (empty list removes it). */
function setRelTokens(
  editor: { _tiptapEditor: unknown },
  range: PmRange,
  tokens: LinkRelToken[],
): void {
  "use no memo";
  const tiptap = editor._tiptapEditor as {
    state: {
      schema: {
        marks: Record<
          string,
          { create: (attrs: { stringValue: string }) => unknown } | undefined
        >;
      };
      tr: {
        removeMark: (from: number, to: number, type: unknown) => unknown;
      };
    };
    view: { dispatch: (tr: unknown) => void };
  };
  const markType = tiptap.state.schema.marks["linkRel"];
  if (!markType) return;
  let tr = tiptap.state.tr.removeMark(range.from, range.to, markType) as {
    addMark: (from: number, to: number, mark: unknown) => unknown;
  };
  if (tokens.length > 0) {
    tr = tr.addMark(
      range.from,
      range.to,
      markType.create({ stringValue: tokens.join(" ") }),
    ) as typeof tr;
  }
  tiptap.view.dispatch(tr);
}

/**
 * Link toolbar (hover/click popup on a link) extended with per-link SEO rel
 * toggles. The tokens are stored as the `linkRel` text style on the link's
 * text (see blocknoteSchema.ts); the server export hoists them onto the
 * published `<a rel>`. Default buttons (edit/open/delete) are kept.
 *
 * Used via LinkToolbarController with `linkToolbar={false}` on BlockNoteView
 * so it REPLACES the built-in toolbar (same pattern as the formatting
 * toolbar above).
 *
 * `"use no memo"` — React-Compiler exempt like every component in this file.
 */
function LinkToolbarWithRel(props: LinkToolbarProps) {
  "use no memo";
  const Components = useComponentsContext()!;
  const editor = useBlockNoteEditor();
  const [tokens, setTokens] = useState<Set<LinkRelToken>>(() =>
    getRelTokens(editor, props.range),
  );

  function toggle(token: LinkRelToken) {
    const next = new Set(tokens);
    if (next.has(token)) next.delete(token);
    else next.add(token);
    setRelTokens(
      editor,
      props.range,
      LINK_REL_TOKENS.filter((t) => next.has(t)),
    );
    setTokens(next);
  }

  return (
    <Components.LinkToolbar.Root className="bn-toolbar bn-link-toolbar">
      <EditLinkButton
        url={props.url}
        text={props.text}
        range={props.range}
        setToolbarOpen={props.setToolbarOpen}
        setToolbarPositionFrozen={props.setToolbarPositionFrozen}
      />
      <OpenLinkButton url={props.url} />
      <DeleteLinkButton
        range={props.range}
        setToolbarOpen={props.setToolbarOpen}
      />
      {LINK_REL_TOKENS.map((token) => (
        <Components.LinkToolbar.Button
          key={token}
          className="bn-button"
          label={token}
          mainTooltip={`Toggle rel="${token}" on this link`}
          isSelected={tokens.has(token)}
          onClick={() => toggle(token)}
        >
          {token}
        </Components.LinkToolbar.Button>
      ))}
    </Components.LinkToolbar.Root>
  );
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

      // Route through the shared library uploader so dropped/pasted files land
      // in the gallery (with a thumbnail + name) and are usage-tracked against
      // the post — and so videos are transcoded + poster-captured like every
      // other path — then hand the public URL back to BlockNote for the block.
      const result = await uploadLibraryMedia(file);
      if (!result.fileUrl) throw new Error("Upload failed - no URL returned");
      return result.fileUrl;
    },
  });

  const [pickerOpen, setPickerOpen] = useState(false);
  // The block where "/" was typed — we insert the picked media after it.
  const insertAfterRef = useRef<string | null>(null);

  // Custom slash-menu entry that inserts an author-controlled table of
  // contents block (live outline in the editor; anchor links when published).
  const tocSlashItem: DefaultReactSuggestionItem = {
    title: "Table of contents",
    subtext: "Linked outline of this article's headings",
    aliases: ["toc", "contents", "outline"],
    group: "Basic blocks",
    icon: <TocIcon />,
    onItemClick: () => {
      const current = editor.getTextCursorPosition().block;
      editor.insertBlocks(
        [{ type: "tableOfContents" } as SchemaPartialBlock],
        current.id,
        "after",
      );
      // The slash trigger leaves an empty paragraph — drop it so the block
      // takes its place cleanly (same cleanup as the media picker insert).
      if (
        current.type === "paragraph" &&
        (current.content as unknown[]).length === 0
      ) {
        editor.removeBlocks([current.id]);
      }
    },
  };

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
        // Same deal for the link toolbar: replaced below by the variant
        // with per-link rel (nofollow/sponsored/ugc) toggles.
        linkToolbar={false}
      >
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={async (query) =>
            filterSuggestionItems(
              combineByGroup(
                getDefaultReactSlashMenuItems(editor),
                getMultiColumnSlashMenuItems(editor),
                [tocSlashItem, mediaSlashItem],
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
        {/* Link toolbar with per-link SEO rel toggles (see LinkToolbarWithRel). */}
        <LinkToolbarController linkToolbar={LinkToolbarWithRel} />
      </BlockNoteView>

      <MediaPickerModal
        isOpen={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handlePick}
      />
    </>
  );
}
