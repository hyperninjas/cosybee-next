// Client-side media derivatives. Runs entirely in the browser — `sharp` is a
// Node library and can't run here, so images use the Canvas API. (Video uses
// ffmpeg.wasm; see media-video.ts.)

/** Longest-side pixel cap for the stored grid thumbnail. */
const THUMB_MAX = 480;
/** Longest-side pixel cap for the inline blur (LQIP) placeholder. */
const BLUR_MAX = 16;

export interface ImageDerivatives {
  width: number;
  height: number;
  /** Small WebP thumbnail to store + load in the grid. */
  thumbBlob: Blob;
  thumbType: string;
  /** Tiny base64 data URL for an instant blur placeholder. */
  blurDataUrl: string;
}

/** Draw a source (bitmap/video) into a canvas scaled to fit `maxSide`. */
function drawScaled(
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  maxSide: number,
): HTMLCanvasElement {
  const scale = Math.min(1, maxSide / Math.max(srcW, srcH));
  const w = Math.max(1, Math.round(srcW * scale));
  const h = Math.max(1, Math.round(srcH * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, w, h);
  return canvas;
}

/** Resolve once on the given event, or reject on `error`/timeout. */
function once(el: HTMLMediaElement, event: string, timeoutMs = 15000): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      el.removeEventListener(event, onOk);
      el.removeEventListener("error", onErr);
      clearTimeout(timer);
    };
    const onOk = () => {
      cleanup();
      resolve();
    };
    const onErr = () => {
      cleanup();
      reject(new Error(`<video> ${event} failed`));
    };
    const timer = setTimeout(onErr, timeoutMs);
    el.addEventListener(event, onOk, { once: true });
    el.addEventListener("error", onErr, { once: true });
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("canvas.toBlob returned null"))),
      type,
      quality,
    );
  });
}

/**
 * Generate a WebP grid thumbnail + a tiny blur placeholder for an image file,
 * plus its intrinsic dimensions. Best-effort: callers should tolerate this
 * throwing (e.g. an exotic format Canvas can't decode) and upload without a
 * thumbnail.
 */
export async function generateImageThumbnail(file: File): Promise<ImageDerivatives> {
  const bitmap = await createImageBitmap(file);
  try {
    const { width, height } = bitmap;
    const thumbBlob = await canvasToBlob(
      drawScaled(bitmap, width, height, THUMB_MAX),
      "image/webp",
      0.82,
    );
    const blurDataUrl = drawScaled(bitmap, width, height, BLUR_MAX).toDataURL("image/webp", 0.5);
    return { width, height, thumbBlob, thumbType: "image/webp", blurDataUrl };
  } finally {
    bitmap.close();
  }
}

export interface VideoDerivatives {
  width: number;
  height: number;
  durationMs: number;
  /** WebP poster frame to store + show as the video thumbnail. */
  posterBlob: Blob;
  posterType: string;
  blurDataUrl: string;
}

/**
 * Capture a poster frame (+ blur, duration, dimensions) from a LOCAL video file
 * via `<video>` + canvas. Reads from the original File (an object URL), so the
 * canvas isn't cross-origin-tainted. Best-effort — callers tolerate it throwing
 * (e.g. a codec the browser can't decode) and upload without a poster.
 *
 * `atFraction` picks where to grab the frame (default 10% in, clamped so it
 * isn't the very first/last frame).
 */
export async function generateVideoPoster(
  file: File,
  atFraction = 0.1,
): Promise<VideoDerivatives> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "metadata";
  video.crossOrigin = "anonymous";
  video.src = url;
  try {
    await once(video, "loadedmetadata");
    const width = video.videoWidth;
    const height = video.videoHeight;
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const durationMs = Math.round(duration * 1000);

    // Seek to the target frame, then wait for the seek to render.
    const t = duration > 0.3 ? Math.min(duration * atFraction, duration - 0.1) : 0;
    video.currentTime = Math.max(0, t);
    await once(video, "seeked");

    const posterBlob = await canvasToBlob(
      drawScaled(video, width, height, THUMB_MAX),
      "image/webp",
      0.82,
    );
    const blurDataUrl = drawScaled(video, width, height, BLUR_MAX).toDataURL("image/webp", 0.5);
    return { width, height, durationMs, posterBlob, posterType: "image/webp", blurDataUrl };
  } finally {
    URL.revokeObjectURL(url);
    video.removeAttribute("src");
    video.load();
  }
}

/** Coarse media kind from a MIME (mirrors the backend's mediaKindFromMime). */
export function kindFromMime(mime: string): "image" | "video" | "pdf" | "document" {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime === "application/pdf") return "pdf";
  return "document";
}
