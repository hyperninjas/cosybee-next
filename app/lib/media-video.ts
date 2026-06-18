// In-browser video transcoding via ffmpeg.wasm. Converts any uploaded video to
// a web-optimized, faststart H.264/AAC MP4 entirely on the client — the server
// never processes video. Uses the SINGLE-THREADED core, so no SharedArrayBuffer
// and no site-wide COOP/COEP cross-origin-isolation headers are required.
//
// The wasm core (~30 MB) is loaded lazily from a pinned CDN on first use and
// cached for the session. To self-host instead, copy @ffmpeg/core's
// dist/umd/{ffmpeg-core.js,ffmpeg-core.wasm} into /public and point CORE_BASE
// at "/ffmpeg".

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

// Pinned single-threaded core. Keep in step with the installed @ffmpeg/ffmpeg.
const CORE_VERSION = "0.12.6";
const CORE_BASE = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd`;

let ffmpegPromise: Promise<FFmpeg> | null = null;

/** Lazily create + load the ffmpeg.wasm instance (cached for the session). */
function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegPromise) return ffmpegPromise;
  ffmpegPromise = (async () => {
    const ffmpeg = new FFmpeg();
    // coreURL/wasmURL are fetched + turned into same-origin blob URLs (so the
    // single-threaded core can run without cross-origin isolation). The class
    // worker is bundled by Next from the @ffmpeg/ffmpeg package.
    await ffmpeg.load({
      coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
    });
    return ffmpeg;
  })();
  // Reset on failure so a retry can re-attempt the load.
  ffmpegPromise.catch(() => {
    ffmpegPromise = null;
  });
  return ffmpegPromise;
}

/** Whether a file should be run through the transcoder (any video). */
export function isTranscodableVideo(file: File): boolean {
  return file.type.startsWith("video/");
}

/**
 * Transcode a video file to a web-streamable MP4 (H.264/AAC, +faststart) in the
 * browser. `onProgress` receives 0–100. Returns a new `.mp4` File.
 *
 * Note: ffmpeg.wasm is ~10–20× slower than native and memory-bound, so this is
 * intended for the capped (≤100 MB) library uploads only.
 */
export async function transcodeToMp4(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<File> {
  const ffmpeg = await getFFmpeg();

  const onProg = ({ progress }: { progress: number }) => {
    onProgress?.(Math.max(0, Math.min(100, Math.round(progress * 100))));
  };
  ffmpeg.on("progress", onProg);

  const input = "input";
  const output = "output.mp4";
  try {
    await ffmpeg.writeFile(input, await fetchFile(file));
    await ffmpeg.exec([
      "-i", input,
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-crf", "23",
      "-pix_fmt", "yuv420p", // broad device compatibility
      "-c:a", "aac",
      "-b:a", "128k",
      "-movflags", "+faststart", // moov atom up front → progressive streaming
      output,
    ]);
    const data = await ffmpeg.readFile(output);
    const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
    // Copy into a fresh ArrayBuffer-backed view so it's a valid BlobPart.
    const blob = new Blob([new Uint8Array(bytes)], { type: "video/mp4" });
    const base = file.name.replace(/\.[^./\\]+$/, "") || "video";
    return new File([blob], `${base}.mp4`, { type: "video/mp4" });
  } finally {
    ffmpeg.off("progress", onProg);
    await ffmpeg.deleteFile(input).catch(() => {});
    await ffmpeg.deleteFile(output).catch(() => {});
  }
}
