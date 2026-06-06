"use client";
"use no memo";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useUpload } from "@/app/hooks/useUpload";
import { validate, LIMITS } from "@/app/lib/storage";

/**
 * Modern image upload with drag-and-drop support.
 * Shows instant local preview, then swaps to the real URL after upload.
 */
export function PublicImageUpload({
  context,
  value,
  onChange,
}: {
  context: "blog-cover" | "blog-content-image" | "user-avatar";
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const { upload, status, progress, error, reset } = useUpload(context);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Revoke object URL on cleanup
  useEffect(
    () => () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    },
    [localPreview],
  );

  const handleFile = useCallback(
    async (file: File) => {
      const problem = validate(file, context);
      if (problem) {
        setClientError(problem);
        return;
      }
      setClientError(null);
      setLocalPreview(URL.createObjectURL(file));
      try {
        const { fileUrl } = await upload(file);
        onChange(fileUrl);
      } catch {
        setLocalPreview(null);
      }
    },
    [context, upload, onChange],
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
  const maxMB = LIMITS[context].maxBytes / 1024 / 1024;
  const isAvatar = context === "user-avatar";

  // If we have an image, show the preview
  if (shown) {
    return (
      <div className="space-y-2">
        <div className={`relative overflow-hidden rounded-lg border border-border ${isAvatar ? "w-24" : "w-full"}`}>
          {isAvatar ? (
            <Image
              src={shown}
              alt="Preview"
              width={96}
              height={96}
              className="h-24 w-24 object-cover"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shown}
              alt="Preview"
              className="h-40 w-full object-cover"
            />
          )}

          {/* Overlay with actions */}
          {!isUploading && (
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all hover:bg-black/50 hover:opacity-100">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-lg bg-surface px-3 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-[#F5F5F5]"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="rounded-lg bg-surface px-3 py-1.5 text-xs font-medium text-accent shadow-sm hover:bg-[#FEF2F2]"
              >
                Remove
              </button>
            </div>
          )}

          {/* Upload progress overlay */}
          {isUploading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
              <div className="mb-2 text-sm font-medium text-white">
                Uploading... {progress}%
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

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
        />

        {(clientError || error) && (
          <p className="text-xs font-medium text-accent">{clientError ?? error}</p>
        )}
      </div>
    );
  }

  // Empty state - dropzone
  return (
    <div className="space-y-2">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isUploading && inputRef.current?.click()}
        className={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-all ${
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
            <p className="text-sm font-medium text-foreground">Uploading... {progress}%</p>
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
              {isDragging ? "Drop image here" : "Click to upload or drag and drop"}
            </p>
            <p className="mt-1 text-xs text-muted">
              PNG, JPG, WebP or AVIF (max {maxMB}MB)
            </p>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        disabled={isUploading}
      />

      {(clientError || error) && (
        <p className="text-xs font-medium text-accent">{clientError ?? error}</p>
      )}
    </div>
  );
}
