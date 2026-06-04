"use client";

import { useCallback, useRef, useState } from "react";
import {
  uploadFile,
  type ConfirmResponse,
  type UploadContext,
} from "@/app/lib/storage";

type Status = "idle" | "uploading" | "done" | "error";

export function useUpload(context: UploadContext) {
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const upload = useCallback(
    async (file: File): Promise<ConfirmResponse> => {
      abortRef.current = new AbortController();
      setStatus("uploading");
      setProgress(0);
      setError(null);
      try {
        const result = await uploadFile(file, context, {
          onProgress: setProgress,
          signal: abortRef.current.signal,
        });
        setStatus("done");
        return result;
      } catch (e) {
        setStatus("error");
        setError(e instanceof Error ? e.message : "Upload failed");
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
