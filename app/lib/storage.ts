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
  | "user-avatar";

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
 */
export async function uploadFile(
  file: File,
  context: UploadContext,
  opts: UploadOptions = {},
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

  // 3) confirm → promotes out of pending/ and returns the live URL/key
  return api<ConfirmResponse>("/api/storage/confirm", {
    method: "POST",
    body: JSON.stringify({ key: presign.key }),
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
  "user-avatar": {
    types: ["image/jpeg", "image/png", "image/webp", "image/avif"],
    maxBytes: 2 * 1024 * 1024,
  },
};

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
