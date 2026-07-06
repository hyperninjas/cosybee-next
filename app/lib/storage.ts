// Browser-side client for the storage module (`/api/storage/*`).
//
// The server never holds file bytes: it mints a presigned S3 POST, the browser
// uploads directly to S3, then the browser confirms so the object is promoted
// from `pending/` to its final, referenceable key.
//
// Upload is always 3 steps: presign → upload to S3 → confirm.
// Framework-agnostic — safe to call from any client component.

import {
  generateImageThumbnail,
  generateVideoPoster,
  kindFromMime,
} from "./media-processing";

const API =
  process.env.NEXT_PUBLIC_API_URL ?? "https://api.energiebee.com";

export type UploadContext =
  | "blog-cover"
  | "blog-content-image"
  | "blog-document"
  | "author-avatar"
  | "user-avatar"
  // Energy-provider brand logo (tariff catalog) — PNG only.
  | "provider-logo"
  // The WordPress-style admin media library (mixed images / video / docs).
  | "media-library"
  // Browser-generated thumbnails/posters for media-library items.
  | "media-thumbnail";

/**
 * Optional metadata sent to `/api/storage/confirm`. Populates the media
 * registry so the asset shows up in the picker, gets dedup'd, and can be
 * cleaned up automatically when replaced/orphaned. Width/height also help
 * the reader render images without layout shift.
 *
 * `name`/`folderId` are media-library-only — the display name and the folder
 * the file lands in; ignored by the single-purpose contexts (covers, avatars).
 */
export interface ConfirmMetadata {
  alt?: string;
  title?: string;
  caption?: string;
  credit?: string;
  width?: number;
  height?: number;
  name?: string;
  folderId?: string | null;
  /** Root folder slug to find-or-create for placement (e.g. "author-avatars"). */
  folderSlug?: string | null;
  // Browser-generated derivatives (Canvas / ffmpeg.wasm).
  thumbnailKey?: string;
  thumbnailUrl?: string;
  blurDataUrl?: string;
  durationMs?: number;
}

export interface PresignResponse {
  context: UploadContext;
  key: string;
  visibility: "public" | "private";
  maxBytes: number;
  expiresIn: number;
  upload: { url: string; fields: Record<string, string> };
  fileUrl: string | null; // always null at presign time
}

export interface ConfirmResponse {
  key: string;
  visibility: "public" | "private";
  fileUrl: string | null; // set for public, null for private
  contentType: string | null;
  size: number | null;
}

export class StorageError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "StorageError";
  }
}

// Call our own API (cookies needed for auth).
async function api<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(API + path, {
    credentials: "include",
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    let code: string | undefined;
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body.message ?? message;
      code = body.code;
    } catch {
      /* non-JSON */
    }
    throw new StorageError(message, res.status, code);
  }
  return res.json() as Promise<T>;
}

export interface UploadOptions {
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

/**
 * Full upload: presign → POST to S3 → confirm. Returns the confirmed object
 * (with `fileUrl` for public contexts, or `key` to store for private ones).
 *
 * Pass `metadata` to populate the media registry: alt/title/caption/credit
 * and natural width/height. Width/height are auto-derived from the file for
 * any image when not supplied.
 */
export async function uploadFile(
  file: File,
  context: UploadContext,
  opts: UploadOptions = {},
  metadata: ConfirmMetadata = {},
): Promise<ConfirmResponse> {
  const key = await presignAndUpload(file, context, opts);

  // Auto-derive natural dimensions for images so the server doesn't have to
  // fetch + decode the asset. Only when the caller didn't supply them.
  const dims =
    metadata.width == null && metadata.height == null && file.type.startsWith("image/")
      ? await readImageDimensions(file).catch(() => null)
      : null;

  return confirmObject(key, {
    ...metadata,
    width: metadata.width ?? dims?.width,
    height: metadata.height ?? dims?.height,
  });
}

/** presign → POST the bytes to S3. Returns the pending object key. */
async function presignAndUpload(
  file: File,
  context: UploadContext,
  opts: UploadOptions = {},
): Promise<string> {
  // Browsers sometimes leave type empty — fall back so the presigned policy's
  // exact Content-Type condition can still match.
  const contentType = file.type || "application/octet-stream";
  const presign = await api<PresignResponse>("/api/storage/presign", {
    method: "POST",
    body: JSON.stringify({ context, filename: file.name, contentType }),
  });
  await postToS3(presign.upload, file, contentType, opts);
  return presign.key;
}

/** confirm → promote out of pending/ and record the registry row. */
function confirmObject(key: string, metadata: ConfirmMetadata): Promise<ConfirmResponse> {
  return api<ConfirmResponse>("/api/storage/confirm", {
    method: "POST",
    body: JSON.stringify({ key, ...stripUndefined({ ...metadata }) }),
  });
}

/**
 * Upload a browser-generated thumbnail/poster blob into the `media-thumbnail`
 * context and return its stable key + public URL (to attach to the parent
 * media row). These never appear in the gallery.
 */
async function uploadThumbnail(blob: Blob): Promise<{ key: string; url: string | null }> {
  const file = new File([blob], "thumb.webp", { type: blob.type || "image/webp" });
  const key = await presignAndUpload(file, "media-thumbnail");
  const confirmed = await confirmObject(key, {});
  return { key: confirmed.key, url: confirmed.fileUrl };
}

/** Drop keys whose value is undefined so the JSON body stays clean. */
function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const k in obj) {
    if (obj[k] !== undefined) out[k] = obj[k];
  }
  return out;
}

/**
 * Read an image's natural pixel dimensions client-side. Uses an object URL
 * and a hidden Image — fast, no server round-trip. Revokes the URL when done.
 */
function readImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image dimensions"));
    };
    img.src = url;
  });
}

/**
 * Submit the presigned POST form to S3. Uses XHR (not fetch) so we get upload
 * progress. CRITICAL: the `file` field MUST be appended LAST — S3 ignores any
 * form field that comes after the file.
 */
function postToS3(
  upload: PresignResponse["upload"],
  file: File,
  contentType: string,
  opts: UploadOptions,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    for (const [k, v] of Object.entries(upload.fields)) form.append(k, v);
    form.append("file", new File([file], file.name, { type: contentType }));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", upload.url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && opts.onProgress) {
        opts.onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(
            new StorageError(`S3 rejected the upload (${xhr.status})`, xhr.status),
          );
    xhr.onerror = () =>
      reject(new StorageError("Network error during upload", 0));
    opts.signal?.addEventListener("abort", () => xhr.abort());
    xhr.send(form);
  });
}

/** Delete a stored object (admin for blog contexts). */
export function deleteObject(
  key: string,
): Promise<{ key: string; deleted: boolean }> {
  return api("/api/storage/object", {
    method: "DELETE",
    body: JSON.stringify({ key }),
  });
}

/**
 * Get a short-lived signed GET URL for a PRIVATE object (admin only).
 * Note: all current contexts (including blog-document) are PUBLIC and return a
 * stable fileUrl, so this is unused today — kept for future private contexts.
 */
export async function getDownloadUrl(key: string): Promise<string> {
  const { url } = await api<{ url: string; expiresIn: number }>(
    `/api/storage/download?key=${encodeURIComponent(key)}`,
    { method: "GET" },
  );
  return url;
}

// ---------------------------------------------------------------------------
// Optional client-side pre-flight. The server + S3 are the source of truth,
// but mirroring the limits gives nicer UX (don't start an upload S3 will reject).
// ---------------------------------------------------------------------------

const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
];

export const LIMITS: Record<
  UploadContext,
  { types: string[]; maxBytes: number }
> = {
  "blog-cover": { types: IMAGE_TYPES, maxBytes: 5 * 1024 * 1024 },
  "blog-content-image": { types: IMAGE_TYPES, maxBytes: 8 * 1024 * 1024 },
  "blog-document": {
    types: ["application/pdf"],
    maxBytes: 20 * 1024 * 1024,
  },
  "author-avatar": {
    types: ["image/jpeg", "image/png", "image/webp", "image/avif"],
    maxBytes: 2 * 1024 * 1024,
  },
  "user-avatar": {
    types: ["image/jpeg", "image/png", "image/webp", "image/avif"],
    maxBytes: 2 * 1024 * 1024,
  },
  "provider-logo": {
    types: ["image/png"],
    maxBytes: 1 * 1024 * 1024,
  },
  // The media library mixes kinds with different ceilings (video is large), so
  // its single `maxBytes` here is the outer bound; `validateLibraryFile`
  // applies the real per-kind caps that mirror the backend context.
  "media-library": {
    types: [
      ...IMAGE_TYPES,
      "video/mp4",
      "video/webm",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    maxBytes: 500 * 1024 * 1024,
  },
  "media-thumbnail": {
    types: ["image/webp", "image/jpeg", "image/png"],
    maxBytes: 2 * 1024 * 1024,
  },
};

// Per-kind caps for the media library, matching the backend `media-library`
// context (storage.contexts.ts): default 20 MB; video 100 MB (the browser
// transcodes it client-side — ffmpeg.wasm can't handle much more).
const LIBRARY_VIDEO_MAX = 100 * 1024 * 1024;
const LIBRARY_DEFAULT_MAX = 20 * 1024 * 1024;

/**
 * Client-side pre-flight for a media-library upload: enforces the allowlist and
 * the per-kind size cap. Returns an error string or null. The server + S3
 * remain the source of truth — this just fails fast with a friendly message.
 */
export function validateLibraryFile(file: File): string | null {
  const isVideo = file.type.startsWith("video/");
  // Any video is allowed as INPUT — it's transcoded to a streamable MP4 in the
  // browser before upload. Other kinds must match the allowlist exactly.
  if (!isVideo && !LIMITS["media-library"].types.includes(file.type)) {
    return `Unsupported type: ${file.type || "unknown"}. Allowed: images, video, PDF, DOC/DOCX.`;
  }
  const cap = isVideo ? LIBRARY_VIDEO_MAX : LIBRARY_DEFAULT_MAX;
  if (file.size > cap) {
    return `File too large (max ${Math.round(cap / 1024 / 1024)}MB for this type).`;
  }
  return null;
}

/** Derive the storage key from a public fileUrl by stripping the host/origin. */
export function keyFromUrl(url: string): string {
  try {
    return new URL(url).pathname.replace(/^\/+/, "");
  } catch {
    return url;
  }
}

export function validate(file: File, ctx: UploadContext): string | null {
  const l = LIMITS[ctx];
  if (!l.types.includes(file.type))
    return `Unsupported type: ${file.type || "unknown"}`;
  if (file.size > l.maxBytes)
    return `File too large (max ${l.maxBytes / 1024 / 1024}MB)`;
  return null;
}

// ===========================================================================
// Media gallery — browser client for the admin media library
// (`/api/storage/media`, `/api/storage/folders`). Mirrors the eb-auth DTOs.
// ===========================================================================

export type MediaKind = "image" | "video" | "pdf" | "document";

export interface MediaTagRef {
  id: string;
  name: string;
  slug: string;
}

export interface MediaUsage {
  postId: string;
  role: string; // "cover" | "og" | "content"
  title: string;
  slug: string;
  status: string;
}

/** An author whose avatar references this media (blocks library deletion). */
export interface MediaAuthorUsage {
  authorId: string;
  name: string;
  slug: string;
}

/** A provider whose logo references this media (blocks library deletion). */
export interface MediaProviderUsage {
  providerId: string;
  name: string;
  slug: string;
}

export interface MediaItem {
  id: string;
  key: string;
  url: string | null;
  context: string;
  kind: MediaKind | null;
  ext: string | null;
  mimeType: string;
  name: string | null;
  alt: string | null;
  title: string | null;
  caption: string | null;
  credit: string | null;
  description: string | null;
  sizeBytes: number | null;
  width: number | null;
  height: number | null;
  durationMs: number | null;
  pageCount: number | null;
  blurDataUrl: string | null;
  thumbnailUrl: string | null;
  folderId: string | null;
  visibility: string;
  tags: MediaTagRef[];
  usages: MediaUsage[];
  authorUsages: MediaAuthorUsage[];
  providerUsages: MediaProviderUsage[];
  createdAt: string;
  updatedAt: string;
}

export interface MediaListResult {
  items: MediaItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface MediaFolder {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  mediaCount: number;
  childCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ListMediaParams {
  page?: number;
  pageSize?: number;
  kind?: MediaKind;
  folderId?: string;
  unfiled?: boolean;
  q?: string;
  tagId?: string;
  /** Filter to media carrying ANY of these tag ids (OR). */
  tagIds?: string[];
}

/** List gallery media (paginated, filterable). */
export function listMedia(params: ListMediaParams = {}): Promise<MediaListResult> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params.kind) qs.set("kind", params.kind);
  if (params.folderId) qs.set("folderId", params.folderId);
  if (params.unfiled) qs.set("unfiled", "true");
  if (params.q) qs.set("q", params.q);
  if (params.tagId) qs.set("tagId", params.tagId);
  if (params.tagIds?.length) qs.set("tagIds", params.tagIds.join(","));
  const query = qs.toString();
  return api<MediaListResult>(`/api/storage/media${query ? `?${query}` : ""}`, {
    method: "GET",
  });
}

/** Fetch a single media item with its tags + post usages. */
export function getMedia(id: string): Promise<MediaItem> {
  return api<MediaItem>(`/api/storage/media/${id}`, { method: "GET" });
}

export interface UpdateMediaInput {
  name?: string;
  alt?: string | null;
  title?: string | null;
  caption?: string | null;
  credit?: string | null;
  description?: string | null;
  folderId?: string | null;
  /** Existing tag ids to apply (replaces the set). */
  tagIds?: string[];
  /** New tag names to create-or-reuse and link; merged with tagIds. */
  tagNames?: string[];
  /** Replace the thumbnail/poster. */
  thumbnailKey?: string | null;
  thumbnailUrl?: string | null;
  blurDataUrl?: string | null;
}

/** Edit a media item's editorial metadata / folder / tags. */
export function updateMedia(id: string, patch: UpdateMediaInput): Promise<MediaItem> {
  return api<MediaItem>(`/api/storage/media/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

/**
 * Replace a media item's thumbnail/poster with a user-supplied image: resize it
 * to a WebP thumbnail + blur (Canvas), upload it, and patch the media row.
 * Returns the updated item. (Used for "change video thumbnail".)
 */
export async function replaceMediaThumbnail(id: string, image: File): Promise<MediaItem> {
  const d = await generateImageThumbnail(image);
  const thumb = await uploadThumbnail(d.thumbBlob);
  return updateMedia(id, {
    thumbnailKey: thumb.key,
    thumbnailUrl: thumb.url,
    blurDataUrl: d.blurDataUrl,
  });
}

/** A tag applied to library media, with how many files carry it. */
export interface MediaTagCount {
  id: string;
  name: string;
  slug: string;
  count: number;
}

/** Tags used by library media (with file counts) — drives the gallery tag filter. */
export function listMediaTags(): Promise<{ items: MediaTagCount[] }> {
  return api<{ items: MediaTagCount[] }>("/api/storage/media-tags", { method: "GET" });
}

/** List the full folder tree (flat, with counts). */
export function listFolders(): Promise<{ items: MediaFolder[] }> {
  return api<{ items: MediaFolder[] }>("/api/storage/folders", { method: "GET" });
}

export function createFolder(input: {
  name: string;
  parentId?: string | null;
}): Promise<MediaFolder> {
  return api<MediaFolder>("/api/storage/folders", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateFolder(
  id: string,
  input: { name?: string; parentId?: string | null },
): Promise<MediaFolder> {
  return api<MediaFolder>(`/api/storage/folders/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteFolder(id: string): Promise<{ deleted: boolean }> {
  return api(`/api/storage/folders/${id}`, { method: "DELETE" });
}

/**
 * Upload a file into the media library: presign → S3 → confirm, in the
 * `media-library` context, recording the display name + folder placement.
 * Returns the confirmed object; the caller re-lists to pick up the new row.
 */
export interface LibraryUploadMeta {
  name?: string;
  folderId?: string | null;
  /** Root folder slug to find-or-create for placement (e.g. "author-avatars"). */
  folderSlug?: string | null;
  alt?: string;
  title?: string;
  caption?: string;
  credit?: string;
  // Pre-generated derivatives supplied by the caller (e.g. the video transcode
  // path passes a poster thumbnail + duration). Images generate their own.
  thumbnailKey?: string;
  thumbnailUrl?: string;
  blurDataUrl?: string;
  durationMs?: number;
  width?: number;
  height?: number;
}

/** Confirm-ready video derivatives (poster already uploaded as a thumbnail). */
type VideoDerived = Pick<
  LibraryUploadMeta,
  "thumbnailKey" | "thumbnailUrl" | "blurDataUrl" | "durationMs" | "width" | "height"
>;

/**
 * Capture a video's poster frame + blur/duration/dimensions and upload the
 * poster as a stored thumbnail, returning confirm-ready derivatives.
 *
 * Capture this from the ORIGINAL file BEFORE any in-browser transcode: decoding
 * a `<video>` right after ffmpeg.wasm has run — especially across a batch, where
 * its heap stays allocated — frequently fails under memory pressure, which is
 * what silently left videos with no thumbnail on multi-file uploads.
 *
 * Best-effort: throws are the caller's to tolerate (upload proceeds sans poster).
 */
export async function captureVideoPoster(file: File): Promise<VideoDerived> {
  const v = await generateVideoPoster(file);
  const thumb = await uploadThumbnail(v.posterBlob);
  return {
    thumbnailKey: thumb.key,
    thumbnailUrl: thumb.url ?? undefined,
    blurDataUrl: v.blurDataUrl,
    durationMs: v.durationMs,
    width: v.width,
    height: v.height,
  };
}

export async function uploadLibraryFile(
  file: File,
  meta: LibraryUploadMeta = {},
  opts: UploadOptions = {},
): Promise<ConfirmResponse> {
  // 1) Upload the original (this drives the progress bar).
  const key = await presignAndUpload(file, "media-library", opts);

  // 2) Derivatives — generated in the browser (Canvas). Images get a WebP
  //    thumbnail + blur LQIP; videos get a captured poster frame + duration.
  //    Best-effort: a failure just means no thumbnail.
  let derived: VideoDerived = {};
  // Skip in-here generation when the caller already supplied a poster — the
  // video path captures it from the pre-transcode source (see captureVideoPoster
  // in handleFiles), which is far more reliable than decoding a just-transcoded
  // MP4. Otherwise generate as a best-effort fallback.
  if (!meta.thumbnailKey) {
    const kind = kindFromMime(file.type);
    try {
      if (kind === "image") {
        const d = await generateImageThumbnail(file);
        const thumb = await uploadThumbnail(d.thumbBlob);
        derived = {
          width: d.width,
          height: d.height,
          blurDataUrl: d.blurDataUrl,
          thumbnailKey: thumb.key,
          thumbnailUrl: thumb.url ?? undefined,
        };
      } else if (kind === "video") {
        derived = await captureVideoPoster(file);
      }
    } catch (e) {
      // Don't fail the upload, but don't hide it either — a swallowed error here
      // is exactly why videos silently ended up with no thumbnail.
      console.warn(`[media] thumbnail generation failed for ${file.name}`, e);
    }
  }

  // 3) Confirm the original with name/folder + derivatives.
  return confirmObject(key, {
    name: meta.name ?? nameFromFilename(file.name),
    folderId: meta.folderId ?? null,
    folderSlug: meta.folderSlug ?? undefined,
    alt: meta.alt,
    title: meta.title,
    caption: meta.caption,
    credit: meta.credit,
    thumbnailKey: meta.thumbnailKey,
    thumbnailUrl: meta.thumbnailUrl,
    blurDataUrl: meta.blurDataUrl,
    durationMs: meta.durationMs,
    width: meta.width,
    height: meta.height,
    ...derived,
  });
}

/**
 * Delete a library item and its generated thumbnail (best-effort on the thumb).
 */
export async function deleteLibraryMedia(media: {
  key: string;
  thumbnailUrl?: string | null;
}): Promise<void> {
  await deleteObject(media.key);
  if (media.thumbnailUrl) {
    await deleteObject(keyFromUrl(media.thumbnailUrl)).catch(() => {});
  }
}

/** Per-id outcome of a batch delete — every requested id lands in one bucket. */
export interface BulkDeleteResult {
  /** Removed (object + thumbnail + row). */
  deleted: string[];
  /** Referenced by a post/author/provider — kept, not deleted. */
  skippedInUse: string[];
  /** Ids that weren't library items. */
  notFound: string[];
  /** Object-store deletion errored — retryable. */
  failed: string[];
}

/**
 * Delete many library items in one request. The server removes each object +
 * its thumbnail, enforces the in-use protection, and reports a per-id outcome.
 */
export function bulkDeleteMedia(ids: string[]): Promise<BulkDeleteResult> {
  return api<BulkDeleteResult>("/api/storage/media/bulk-delete", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });
}

/**
 * Move many library items into a folder (or `null` to unfile) in one request.
 * Returns how many rows actually changed.
 */
export function bulkMoveMedia(
  ids: string[],
  folderId: string | null,
): Promise<{ moved: number }> {
  return api<{ moved: number }>("/api/storage/media/bulk-move", {
    method: "PATCH",
    body: JSON.stringify({ ids, folderId }),
  });
}

/** Filename → display name: drop the extension, leave the rest as-is. */
function nameFromFilename(filename: string): string {
  const base = filename.replace(/\.[^./\\]+$/, "").trim();
  return base || filename;
}
