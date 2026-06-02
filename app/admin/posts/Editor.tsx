"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import type { PartialBlock } from "@blocknote/core";
import { uploadImage } from "../actions";

type Props = {
  /** Initial document (parsed from Post.contentJson). */
  initialContent?: PartialBlock[];
  /** Called with the full document on every edit. */
  onChange: (blocks: PartialBlock[]) => void;
};

/**
 * The BlockNote (Mantine) WYSIWYG editor. Loaded client-only via
 * next/dynamic (BlockNote relies on browser APIs and can't SSR).
 * Images dropped/added inside the article upload to /public/uploads
 * via the `uploadImage` Server Action.
 */
export default function Editor({ initialContent, onChange }: Props) {
  const editor = useCreateBlockNote({
    initialContent: initialContent?.length ? initialContent : undefined,
    uploadFile: async (file: File) => {
      const fd = new FormData();
      fd.set("file", file);
      return uploadImage(fd);
    },
  });

  return (
    <BlockNoteView
      editor={editor}
      theme="light"
      onChange={() => onChange(editor.document)}
    />
  );
}
