"use client";
"use no memo";

import { useCallback, useEffect, useRef, useState } from "react";
import { useUpload } from "@/app/hooks/useUpload";
import {
  validate,
  validateLibraryFile,
  LIMITS,
  type MediaItem,
} from "@/app/lib/storage";
import { MediaPickerModal } from "@/app/(private)/admin/media/MediaPickerModal";

/**
 * Modern image upload with drag-and-drop support.
 * Shows instant local preview, then swaps to the real URL after upload.
 */
export function PublicImageUpload({
  context,
  value,
  onChange,
  disabled = false,
  alt,
  title,
  caption,
  credit,
  previewHeight = "h-48",
  library = false,
  libraryFolderSlug,
  acceptMime,
  onPickFromLibrary,
}: {
  context:
    | "blog-cover"
    | "blog-content-image"
    | "user-avatar"
    | "author-avatar"
    | "provider-logo";
  value: string | null;
  /** Restrict accepted image types (both new uploads AND library picks) to
   *  these MIME types, e.g. ["image/png"] for logos. Omit for any image. */
  acceptMime?: readonly string[];
  onChange: (url: string | null) => void;
  /** Block uploads (e.g. unverified email — the backend would 403 anyway). */
  disabled?: boolean;
  /** Route the upload into the managed media library so it shows up in the
   *  gallery, gets a thumbnail, and is usage-tracked against the post. The
   *  `context` is then used only for the file-type allowlist + size label. */
  library?: boolean;
  /** In `library` mode, new uploads are placed in this root folder (found or
   *  created by slug, e.g. "author-avatars") instead of unfiled. Picking an
   *  existing asset from the library is unaffected. */
  libraryFolderSlug?: string;
  /** Called (in addition to `onChange`) when an existing asset is chosen from
   *  the library, so the caller can pull the asset's alt/title/caption/credit
   *  into its own fields. Only fires in `library` mode. */
  onPickFromLibrary?: (media: MediaItem) => void;
  /** Tailwind height class for the (non-avatar) preview image. Defaults to
   *  `h-48`; pass e.g. `h-56`/`h-64` for a taller preview. Avatars ignore this
   *  (they render fixed square). */
  previewHeight?: string;
  /** Forwarded to /storage/confirm so the asset lands in the media registry
   *  with proper accessibility metadata. Width/height are auto-derived from
   *  the file — no need to pass them. */
  alt?: string;
  title?: string;
  caption?: string;
  credit?: string;
}) {
  const { upload, status, progress, error, reset } = useUpload(context, {
    library,
  });
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Pick an existing image from the media library instead of uploading a new
  // one (library mode only). The chosen item's public URL becomes the value.
  const handleLibraryPick = useCallback(
    (media: MediaItem) => {
      if (!media.url) return;
      if (
        acceptMime &&
        media.mimeType &&
        !acceptMime.includes(media.mimeType)
      ) {
        setClientError(
          `Please choose a ${acceptMime
            .map((t) => t.split("/")[1]?.toUpperCase() ?? t)
            .join(" or ")} image.`,
        );
        return;
      }
      setClientError(null);
      setLocalPreview(null);
      onChange(media.url);
      // Let the caller copy the asset's editorial metadata into its fields.
      onPickFromLibrary?.(media);
    },
    [onChange, onPickFromLibrary, acceptMime],
  );

  // Revoke object URL on cleanup
  useEffect(
    () => () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    },
    [localPreview],
  );

  const handleFile = useCallback(
    async (file: File) => {
      const problem = library
        ? validateLibraryFile(file)
        : validate(file, context);
      if (problem) {
        setClientError(problem);
        return;
      }
      if (acceptMime && !acceptMime.includes(file.type)) {
        setClientError(
          `Please choose a ${acceptMime
            .map((t) => t.split("/")[1]?.toUpperCase() ?? t)
            .join(" or ")} image.`,
        );
        return;
      }
      setClientError(null);
      setLocalPreview(URL.createObjectURL(file));
      try {
        const { fileUrl } = await upload(file, {
          alt,
          title,
          caption,
          credit,
          ...(library && libraryFolderSlug
            ? { folderSlug: libraryFolderSlug }
            : {}),
        });
        onChange(fileUrl);
      } catch {
        setLocalPreview(null);
      }
    },
    [
      context,
      library,
      libraryFolderSlug,
      acceptMime,
      upload,
      onChange,
      alt,
      title,
      caption,
      credit,
    ],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemove = () => {
    onChange(null);
    setLocalPreview(null);
    reset();
    if (inputRef.current) inputRef.current.value = "";
  };

  const shown = localPreview ?? value;
  const isUploading = status === "uploading";
  // In library mode images are capped at 20MB (the library's per-image cap),
  // otherwise the context's own ceiling applies.
  const maxMB = library ? 20 : LIMITS[context].maxBytes / 1024 / 1024;
  // Avatars and logos render in a fixed square (they're small, identity-sized
  // images). Logos use object-contain so a non-square wordmark isn't cropped;
  // avatars use object-cover to fill the circle-ish frame.
  const isLogo = context === "provider-logo";
  const isSquare =
    context === "user-avatar" || context === "author-avatar" || isLogo;
  // Restrict the file picker to the accepted types (defaults to any image).
  const acceptAttr = acceptMime ? acceptMime.join(",") : "image/*";

  // Rendered in both the preview and empty states (library mode only) so the
  // modal is mounted regardless of which branch returns.
  const libraryPicker = library ? (
    <MediaPickerModal
      isOpen={pickerOpen}
      onOpenChange={setPickerOpen}
      onSelect={handleLibraryPick}
      accept="image"
      acceptMime={acceptMime}
      heading="Choose an image from your library"
    />
  ) : null;

  // If we have an image, show the preview
  if (shown) {
    // The image frame: square (small, fixed) for avatars/logos, full-width for
    // covers. The hover-overlay actions only fit on the large covers; square
    // previews are too small, so they show the actions in a column beside it.
    const frame = (
      <div
        className={`relative shrink-0 overflow-hidden rounded-3xl border border-border ${isSquare ? "h-24 w-24" : "w-full"} ${isLogo ? "bg-surface-secondary" : ""}`}
      >
        {/* Plain <img> on purpose: `shown` is often a `blob:` local-preview
            URL (and otherwise an ephemeral uploaded URL) which next/image
            cannot optimize — sending those through it breaks sizing. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={shown}
          alt="Preview"
          className={
            isSquare
              ? `absolute inset-0 h-full w-full ${isLogo ? "object-contain p-1.5" : "object-cover"}`
              : `${previewHeight} w-full object-cover`
          }
        />

        {/* Hover-overlay actions — covers only (the square frame is too small). */}
        {!isSquare && !isUploading && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all hover:bg-black/50 hover:opacity-100">
            <button
              type="button"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              className="rounded-lg bg-surface px-3 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-[#F5F5F5] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              Replace
            </button>
            {library && (
              <button
                type="button"
                disabled={disabled}
                onClick={() => setPickerOpen(true)}
                className="rounded-lg bg-surface px-3 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-[#F5F5F5] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                Library
              </button>
            )}
            <button
              type="button"
              onClick={handleRemove}
              className="rounded-lg bg-surface px-3 py-1.5 text-xs font-medium cursor-pointer text-accent shadow-sm hover:bg-[#FEF2F2]"
            >
              Remove
            </button>
          </div>
        )}

        {/* Upload progress overlay */}
        {isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
            <div className="mb-1 text-xs font-medium text-white">
              {progress}%
            </div>
            <div className="h-1.5 w-3/4 overflow-hidden rounded-full bg-surface/30">
              <div
                className="h-full rounded-full bg-surface transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );

    // Square previews show their actions as a button column to the right.
    const sideActions = !isUploading && (
      <div className="flex flex-col items-start gap-1.5">
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-accent hover:text-accent cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          Replace
        </button>
        {library && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => setPickerOpen(true)}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-accent hover:text-accent cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            Library
          </button>
        )}
        <button
          type="button"
          onClick={handleRemove}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:border-accent cursor-pointer"
        >
          Remove
        </button>
      </div>
    );

    return (
      <div className="space-y-2">
        {isSquare ? (
          <div className="flex items-center gap-3">
            {frame}
            {sideActions}
          </div>
        ) : (
          frame
        )}

        <input
          ref={inputRef}
          type="file"
          accept={acceptAttr}
          onChange={handleInputChange}
          className="hidden"
        />

        {(clientError || error) && (
          <p className="text-xs font-medium text-accent">
            {clientError ?? error}
          </p>
        )}
        {libraryPicker}
      </div>
    );
  }

  // Empty state - dropzone
  return (
    <div className="space-y-2">
      <div
        onDrop={disabled ? undefined : handleDrop}
        onDragOver={disabled ? undefined : handleDragOver}
        onDragLeave={disabled ? undefined : handleDragLeave}
        onClick={() => !disabled && !isUploading && inputRef.current?.click()}
        aria-disabled={disabled}
        className={`relative flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-6 transition-all ${
          disabled ? "pointer-events-none opacity-50" : ""
        } ${
          isDragging
            ? "border-accent bg-danger-soft"
            : "border-border bg-background hover:border-accent hover:bg-danger-soft"
        } ${isUploading ? "pointer-events-none opacity-60" : ""}`}
      >
        {isUploading ? (
          <>
            <div className="mb-3 flex h-10 w-10 items-center justify-center">
              <svg
                className="h-6 w-6 animate-spin text-accent"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground">
              Uploading... {progress}%
            </p>
            <div className="mt-2 h-1.5 w-32 overflow-hidden rounded-full bg-surface-secondary">
              <div
                className="h-full rounded-full bg-accent transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        ) : (
          <>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-danger-soft">
              <svg
                className="h-5 w-5 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground">
              {isDragging
                ? "Drop image here"
                : "Click to upload or drag and drop"}
            </p>
            <p className="mt-1 text-xs text-muted">
              PNG, JPG, WebP or AVIF (max {maxMB}MB)
            </p>
          </>
        )}
      </div>

      {/* Reuse an existing library image instead of uploading a new one. */}
      {library && !isUploading && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setPickerOpen(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-3xl border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-accent hover:text-accent cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.5-3.5L9 20" />
          </svg>
          Choose from media library
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        disabled={isUploading}
      />

      {(clientError || error) && (
        <p className="text-xs font-medium text-accent">
          {clientError ?? error}
        </p>
      )}
      {libraryPicker}
    </div>
  );
}
