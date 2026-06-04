"use client";

import { useEffect, useState } from "react";
import { useUpload } from "@/app/hooks/useUpload";
import { validate } from "@/app/lib/storage";

/**
 * Public image upload (cover / avatar). Shows an instant local preview via
 * URL.createObjectURL, then swaps to the real `fileUrl` after confirm. Reports
 * the final public URL up to the parent via onChange.
 */
export function PublicImageUpload({
  context,
  value,
  onChange,
}: {
  context: "blog-cover" | "blog-content-image" | "user-avatar";
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const { upload, status, progress, error, reset } = useUpload(context);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  // revoke the object URL when it changes/unmounts to avoid leaks
  useEffect(
    () => () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    },
    [localPreview],
  );

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const problem = validate(file, context);
    if (problem) {
      setClientError(problem);
      return;
    }
    setClientError(null);
    setLocalPreview(URL.createObjectURL(file)); // optimistic preview
    try {
      const { fileUrl } = await upload(file);
      onChange(fileUrl); // <- store this on your record
    } catch {
      setLocalPreview(null); // error already surfaced by hook
    }
  }

  const shown = localPreview ?? value;

  return (
    <div className="space-y-2">
      {shown && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={shown} alt="" className="h-40 w-full rounded object-cover" />
      )}

      <input
        type="file"
        accept="image/*"
        onChange={handleFile}
        disabled={status === "uploading"}
      />

      {status === "uploading" && (
        <div className="h-2 w-full rounded bg-gray-200">
          <div
            className="h-2 rounded bg-blue-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      {(clientError || error) && (
        <p className="text-sm text-red-600">{clientError ?? error}</p>
      )}
      {value && status !== "uploading" && (
        <button
          type="button"
          className="text-sm text-gray-600 underline"
          onClick={() => {
            onChange(null);
            setLocalPreview(null);
            reset();
          }}
        >
          Remove
        </button>
      )}
    </div>
  );
}
