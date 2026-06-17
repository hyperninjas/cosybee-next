"use client";

import { useState } from "react";
import { useUpload } from "@/app/hooks/useUpload";
import { validate } from "@/app/lib/storage";

/**
 * Public non-image file upload (e.g. blog-document PDF). Returns a stable public
 * `fileUrl` on confirm — store it and link/embed it directly, no signed URL.
 */
export function PublicFileUpload({
  value,
  onChange,
  accept = "application/pdf",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  accept?: string;
}) {
  const { upload, status, progress, error } = useUpload("blog-document");
  const [clientError, setClientError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const problem = validate(file, "blog-document");
    if (problem) {
      setClientError(problem);
      return;
    }
    setClientError(null);
    try {
      const { fileUrl } = await upload(file); // public → stable fileUrl
      onChange(fileUrl); // <- store this URL on your record
    } catch {
      /* error surfaced by hook */
    }
  }

  return (
    <div className="space-y-2">
      <input
        type="file"
        accept={accept}
        onChange={handleFile}
        disabled={status === "uploading"}
      />
      {status === "uploading" && <progress value={progress} max={100} />}
      {(clientError || error) && (
        <p className="text-sm text-danger">{clientError ?? error}</p>
      )}
      {value && (
        <div className="space-y-2">
          <a
            href={value}
            target="_blank"
            rel="noopener"
            className="text-sm text-blue-600 underline"
          >
            Open file
          </a>
          <iframe
            src={value}
            title="document"
            className="h-150 w-full rounded border"
          />
        </div>
      )}
    </div>
  );
}
