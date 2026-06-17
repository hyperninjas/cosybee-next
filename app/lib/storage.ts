// Browser-side client for the storage module (`/api/storage/*`).
//
// The server never holds file bytes: it mints a presigned S3 POST, the browser
// uploads directly to S3, then the browser confirms so the object is promoted
// from `pending/` to its final, referenceable key.
//
// Upload is always 3 steps: presign → upload to S3 → confirm.
// Framework-agnostic — safe to call from any client component.

const API =
  process.env.NEXT_PUBLIC_API_URL ?? "https://api.energiebee.com";

export type UploadContext =
  | "blog-cover"
  | "blog-content-image"
  | "blog-document"
  | "author-avatar"
  | "user-avatar"
  // The WordPress-style admin media library (mixed images / video / docs).
  | "media-library";

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
  // Browsers sometimes leave file.type empty — fall back so the presigned
  // policy's exact Content-Type condition can still match.
  const contentType = file.type || "application/octet-stream";

  // 1) presign
  const presign = await api<PresignResponse>("/api/storage/presign", {
    method: "POST",
    body: JSON.stringify({ context, filename: file.name, contentType }),
  });

  // 2) upload bytes straight to S3
  await postToS3(presign.upload, file, contentType, opts);

  // 3) auto-derive natural dimensions for images so the server doesn't have
  // to fetch + decode the asset just to learn them. Only runs when the caller
  // didn't supply explicit values.
  const dims =
    metadata.width == null && metadata.height == null && file.type.startsWith("image/")
      ? await readImageDimensions(file).catch(() => null)
      : null;

  // 4) confirm → promotes out of pending/ and returns the live URL/key
  return api<ConfirmResponse>("/api/storage/confirm", {
    method: "POST",
    body: JSON.stringify({
      key: presign.key,
      ...stripUndefined({
        ...metadata,
        width: metadata.width ?? dims?.width,
        height: metadata.height ?? dims?.height,
      }),
    }),
  });
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
};

// Per-kind caps for the media library, matching the backend `media-library`
// context (storage.contexts.ts): default 20 MB, video 500 MB.
const LIBRARY_VIDEO_MAX = 500 * 1024 * 1024;
const LIBRARY_DEFAULT_MAX = 20 * 1024 * 1024;

/**
 * Client-side pre-flight for a media-library upload: enforces the allowlist and
 * the per-kind size cap. Returns an error string or null. The server + S3
 * remain the source of truth — this just fails fast with a friendly message.
 */
export function validateLibraryFile(file: File): string | null {
  if (!LIMITS["media-library"].types.includes(file.type)) {
    return `Unsupported type: ${file.type || "unknown"}. Allowed: images, MP4/WebM video, PDF, DOC/DOCX.`;
  }
  const cap = file.type.startsWith("video/") ? LIBRARY_VIDEO_MAX : LIBRARY_DEFAULT_MAX;
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
}

/** Edit a media item's editorial metadata / folder / tags. */
export function updateMedia(id: string, patch: UpdateMediaInput): Promise<MediaItem> {
  return api<MediaItem>(`/api/storage/media/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
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
  alt?: string;
  title?: string;
  caption?: string;
  credit?: string;
}

export function uploadLibraryFile(
  file: File,
  meta: LibraryUploadMeta = {},
  opts: UploadOptions = {},
): Promise<ConfirmResponse> {
  return uploadFile(file, "media-library", opts, {
    // Auto-fill the display name from the filename (extension stripped) so a
    // bulk upload still gets readable names; the rest stays blank for the admin
    // to fill in later via the media detail editor.
    name: meta.name ?? nameFromFilename(file.name),
    folderId: meta.folderId ?? null,
    alt: meta.alt,
    title: meta.title,
    caption: meta.caption,
    credit: meta.credit,
  });
}

/** Filename → display name: drop the extension, leave the rest as-is. */
function nameFromFilename(filename: string): string {
  const base = filename.replace(/\.[^./\\]+$/, "").trim();
  return base || filename;
}
