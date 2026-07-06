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

/** Whether a file is a video we handle in the library at all. */
export function isTranscodableVideo(file: File): boolean {
  return file.type.startsWith("video/");
}

// ── Fast pre-check: does the video actually need transcoding? ───────────────
// A file is already web-ready (skip the expensive transcode, upload as-is) when
// it's an MP4 container carrying H.264 video + AAC/no audio, with the `moov`
// atom in front of the media data (faststart → progressive streaming). We
// determine this by parsing the MP4 box structure straight from the bytes — a
// handful of small `slice()` reads, and crucially NO ffmpeg.wasm download.

/** ftyp brands that mean "MP4 family" (as opposed to QuickTime `qt  `, etc.). */
const MP4_BRANDS = new Set([
  "isom", "iso2", "iso4", "iso5", "iso6", "mp41", "mp42", "avc1", "dash",
  "cmfc", "mmp4", "M4V ", "M4A ", "f4v ", "MSNV", "NDSC",
]);
const H264_FORMATS = new Set(["avc1", "avc3"]);
const AAC_FORMATS = new Set(["mp4a"]);
// Known sample-entry 4CCs, used to reject anything that ISN'T H.264 / AAC.
// (Unknown 4CCs — e.g. timed-metadata tracks — are ignored, not treated as bad.)
const KNOWN_VIDEO_FORMATS = new Set([
  "avc1", "avc3", "hev1", "hvc1", "vp08", "vp09", "av01", "mp4v", "mjpg",
  "jpeg", "dvav", "dvhe", "s263",
]);
const KNOWN_AUDIO_FORMATS = new Set([
  "mp4a", "ac-3", "ec-3", "dtsc", "dtsh", "dtsl", "alac", "samr", "sawb",
  "mlpa", "Opus", "fLaC", ".mp3",
]);

const fourcc = (b: Uint8Array, off: number) =>
  String.fromCharCode(b[off], b[off + 1], b[off + 2], b[off + 3]);

interface Box {
  type: string;
  start: number;
  size: number;
  dataStart: number;
}

/** Read a single box header at `offset` (handles 32/64-bit sizes). */
async function readBoxHeader(file: File, offset: number): Promise<Box | null> {
  const buf = new Uint8Array(await file.slice(offset, offset + 16).arrayBuffer());
  if (buf.length < 8) return null;
  const dv = new DataView(buf.buffer);
  let size = dv.getUint32(0);
  const type = fourcc(buf, 4);
  let header = 8;
  if (size === 1) {
    if (buf.length < 16) return null;
    size = dv.getUint32(8) * 2 ** 32 + dv.getUint32(12); // 64-bit largesize
    header = 16;
  } else if (size === 0) {
    size = file.size - offset; // box runs to EOF
  }
  if (size < header) return null;
  return { type, start: offset, size, dataStart: offset + header };
}

/** Collect every `stsd` sample-entry format 4CC inside an in-memory `moov`. */
function stsdFormats(moov: ArrayBuffer): string[] {
  const bytes = new Uint8Array(moov);
  const dv = new DataView(moov);
  const CONTAINERS = new Set(["trak", "mdia", "minf", "stbl", "edts", "dinf", "mvex"]);
  const formats: string[] = [];
  const walk = (start: number, end: number, depth: number) => {
    let off = start;
    while (off + 8 <= end && depth <= 8) {
      let size = dv.getUint32(off);
      const type = fourcc(bytes, off + 4);
      let header = 8;
      if (size === 1) {
        size = dv.getUint32(off + 8) * 2 ** 32 + dv.getUint32(off + 12);
        header = 16;
      } else if (size === 0) {
        size = end - off;
      }
      if (size < header) break;
      const dataEnd = Math.min(off + size, end);
      if (type === "stsd") {
        // 4 bytes version/flags + 4 bytes entry count, then sized entries.
        let p = off + header + 8;
        while (p + 8 <= dataEnd) {
          const entrySize = dv.getUint32(p);
          formats.push(fourcc(bytes, p + 4));
          if (entrySize < 8) break;
          p += entrySize;
        }
      } else if (CONTAINERS.has(type)) {
        walk(off + header, dataEnd, depth + 1);
      }
      off += size;
    }
  };
  walk(0, bytes.byteLength, 0);
  return formats;
}

async function inspectVideo(file: File): Promise<boolean> {
  // 1) Walk the top-level boxes (ftyp, moov, mdat/moof, …).
  const boxes: Box[] = [];
  let off = 0;
  for (let i = 0; i < 64 && off + 8 <= file.size; i++) {
    const box = await readBoxHeader(file, off);
    if (!box) break;
    boxes.push(box);
    off = box.start + box.size;
  }

  // 2) Container must be MP4-family (a valid ftyp with an MP4 brand).
  const ftyp = boxes.find((b) => b.type === "ftyp");
  if (!ftyp) return true;
  const fb = new Uint8Array(await file.slice(ftyp.dataStart, ftyp.start + ftyp.size).arrayBuffer());
  const brands: string[] = [];
  for (let p = 0; p + 4 <= fb.length; p += 4) {
    if (p === 4) continue; // skip minor_version (between major + compatible brands)
    brands.push(fourcc(fb, p));
  }
  if (!brands.some((b) => MP4_BRANDS.has(b))) return true;

  // 3) Faststart: `moov` must sit before the media payload.
  const moov = boxes.find((b) => b.type === "moov");
  const media = boxes.find((b) => b.type === "mdat" || b.type === "moof");
  if (!moov || !media || moov.start > media.start) return true;

  // 4) Codecs: read the (front-loaded, small) moov and check sample entries.
  const moovBuf = await file.slice(moov.dataStart, moov.start + moov.size).arrayBuffer();
  const formats = stsdFormats(moovBuf);
  const hasH264 = formats.some((f) => H264_FORMATS.has(f));
  const badVideo = formats.some((f) => KNOWN_VIDEO_FORMATS.has(f) && !H264_FORMATS.has(f));
  const badAudio = formats.some((f) => KNOWN_AUDIO_FORMATS.has(f) && !AAC_FORMATS.has(f));

  // Already a streamable H.264/AAC MP4 → no transcode needed.
  return !hasH264 || badVideo || badAudio;
}

/**
 * Whether `file` needs transcoding to a web-streamable MP4, or is already one.
 * Parses the MP4 boxes directly — no ffmpeg.wasm. Any parse failure or unknown
 * shape returns `true` (transcode), so we only skip when we're confident.
 */
export async function videoNeedsTranscode(file: File): Promise<boolean> {
  try {
    return await inspectVideo(file);
  } catch {
    return true;
  }
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
