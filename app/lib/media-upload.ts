// Single entry point for uploading a file into the media library. Videos are
// transcoded to a streamable MP4 and get a poster captured from the ORIGINAL
// file (before ffmpeg.wasm loads down memory); everything else falls straight
// through. Every library upload should go through here — calling
// `uploadLibraryFile` directly skips transcoding and the reliable poster path,
// which is how videos slipped in un-optimized / without a thumbnail.
//
// Kept separate from `storage.ts` so the heavy ffmpeg.wasm dependency is only
// pulled into bundles that actually upload media (the gallery + post editor),
// not every module that touches storage.

"use client";

import {
  captureVideoPoster,
  uploadLibraryFile,
  type ConfirmResponse,
  type LibraryUploadMeta,
} from "@/app/lib/storage";
import {
  isTranscodableVideo,
  transcodeToMp4,
  videoNeedsTranscode,
} from "@/app/lib/media-video";

export type UploadPhase = "converting" | "uploading";

export interface UploadHandlers {
  /** 0–100 for the current phase (transcode, then S3 upload). */
  onProgress?: (percent: number) => void;
  /** Phase changes, for callers that show a "Compressing… / Uploading…" state. */
  onPhase?: (phase: UploadPhase) => void;
}

/**
 * Upload one file into the media library, doing the right thing per kind:
 * - video → capture poster from the source; transcode to a faststart MP4 ONLY
 *   if it isn't already a web-ready H.264/AAC MP4; then upload
 * - image/pdf/doc → upload as-is (`uploadLibraryFile` derives its own thumbnail)
 *
 * Best-effort on the poster: if capture fails, the upload still proceeds and
 * `uploadLibraryFile` retries a poster post-transcode.
 */
export async function uploadLibraryMedia(
  file: File,
  meta: LibraryUploadMeta = {},
  handlers: UploadHandlers = {},
): Promise<ConfirmResponse> {
  const { onProgress, onPhase } = handlers;

  if (!isTranscodableVideo(file)) {
    onPhase?.("uploading");
    return uploadLibraryFile(file, meta, { onProgress });
  }

  const merged: LibraryUploadMeta = { ...meta };

  // Capture the poster BEFORE transcoding — decoding a <video> right after
  // ffmpeg.wasm runs (and across a batch, heap still allocated) fails under
  // memory pressure, which silently left videos with no thumbnail.
  try {
    Object.assign(merged, await captureVideoPoster(file));
  } catch (e) {
    console.warn(`[media] poster capture failed for ${file.name}`, e);
  }

  // Only transcode when the file isn't already a streamable MP4. Probing is a
  // few small byte-range reads and, for already-web-ready files, skips loading
  // ffmpeg.wasm entirely — we just upload the original with its poster.
  let toUpload = file;
  if (await videoNeedsTranscode(file)) {
    onPhase?.("converting");
    toUpload = await transcodeToMp4(file, onProgress);
  }

  onPhase?.("uploading");
  onProgress?.(0);
  return uploadLibraryFile(toUpload, merged, { onProgress });
}
