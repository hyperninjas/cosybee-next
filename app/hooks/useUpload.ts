"use client";

import { useCallback, useRef, useState } from "react";
import {
  uploadFile,
  uploadLibraryFile,
  StorageError,
  type ConfirmMetadata,
  type ConfirmResponse,
  type LibraryUploadMeta,
  type UploadContext,
} from "@/app/lib/storage";
import { handleAuthError } from "@/app/lib/api-error";

type Status = "idle" | "uploading" | "done" | "error";

/**
 * @param options.library  Route the upload through the managed media library
 *   (`media-library` context) instead of the single-purpose `context`. The file
 *   then shows up in the admin gallery, gets a generated thumbnail, and is
 *   usage-tracked against the post — while still returning the same public URL.
 */
export function useUpload(
  context: UploadContext,
  options: { library?: boolean } = {},
) {
  const { library = false } = options;
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const upload = useCallback(
    async (file: File, metadata?: ConfirmMetadata): Promise<ConfirmResponse> => {
      abortRef.current = new AbortController();
      setStatus("uploading");
      setProgress(0);
      setError(null);
      try {
        const transfer = {
          onProgress: setProgress,
          signal: abortRef.current.signal,
        };
        const result = library
          ? await uploadLibraryFile(
              file,
              (metadata ?? {}) as LibraryUploadMeta,
              transfer,
            )
          : await uploadFile(file, context, transfer, metadata);
        setStatus("done");
        return result;
      } catch (e) {
        setStatus("error");
        // Route cross-cutting codes (e.g. EMAIL_NOT_VERIFIED → verify-email,
        // ACCOUNT_BANNED → banned). Only show an inline message otherwise.
        const code = e instanceof StorageError ? e.code : undefined;
        if (!(await handleAuthError(code))) {
          setError(e instanceof Error ? e.message : "Upload failed");
        }
        throw e;
      }
    },
    [context, library],
  );

  const cancel = useCallback(() => abortRef.current?.abort(), []);
  const reset = useCallback(() => {
    setStatus("idle");
    setProgress(0);
    setError(null);
  }, []);

  return { upload, cancel, reset, status, progress, error };
}
