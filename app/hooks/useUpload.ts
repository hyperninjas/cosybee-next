"use client";

import { useCallback, useRef, useState } from "react";
import {
  uploadFile,
  StorageError,
  type ConfirmMetadata,
  type ConfirmResponse,
  type UploadContext,
} from "@/app/lib/storage";
import { handleAuthError } from "@/app/lib/api-error";

type Status = "idle" | "uploading" | "done" | "error";

export function useUpload(context: UploadContext) {
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
        const result = await uploadFile(
          file,
          context,
          { onProgress: setProgress, signal: abortRef.current.signal },
          metadata,
        );
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
    [context],
  );

  const cancel = useCallback(() => abortRef.current?.abort(), []);
  const reset = useCallback(() => {
    setStatus("idle");
    setProgress(0);
    setError(null);
  }, []);

  return { upload, cancel, reset, status, progress, error };
}
