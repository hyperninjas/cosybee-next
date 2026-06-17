"use client";

import { Button, EmptyState } from "@heroui/react";

function PhotoStackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="5" width="14" height="14" rx="2" />
      <circle cx="8" cy="10" r="1.5" />
      <path d="m3 16 3.5-3.5a2 2 0 0 1 2.8 0L17 19" />
      <path d="M8 5V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-1" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

/**
 * Gallery empty state. Distinguishes a genuinely empty library (offer to
 * upload) from an active filter/search returning nothing (offer to clear).
 */
export function MediaEmptyState({
  filtered,
  onUpload,
  onClear,
}: {
  filtered: boolean;
  onUpload?: () => void;
  onClear?: () => void;
}) {
  return (
    <EmptyState className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-accent/10 text-accent">
        {filtered ? <SearchIcon className="size-8" /> : <PhotoStackIcon className="size-8" />}
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base font-bold text-foreground">
          {filtered ? "No matching media" : "Your media library is empty"}
        </h3>
        <p className="mx-auto max-w-sm text-sm text-muted">
          {filtered
            ? "No files match the current filters. Try a different search, type, folder, or tag."
            : "Upload images, video, PDFs or documents — or drag and drop files anywhere in this area to add them."}
        </p>
      </div>

      {filtered
        ? onClear && (
            <Button variant="secondary" onPress={onClear}>
              Clear filters
            </Button>
          )
        : onUpload && (
            <Button variant="primary" onPress={onUpload}>
              Upload media
            </Button>
          )}
    </EmptyState>
  );
}
