"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import type { PartialBlock } from "@blocknote/core";
import { uploadFile, validate } from "@/app/lib/storage";

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
 */
export default function Editor({ initialContent, onChange }: Props) {
  const editor = useCreateBlockNote({
    initialContent: initialContent?.length ? initialContent : undefined,
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
      onChange={() => onChange(editor.document)}
    />
  );
}
