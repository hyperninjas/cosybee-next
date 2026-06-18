"use client";

import { Card, ProgressCircle } from "@heroui/react";
import { formatBytes, kindFromMime, KindIcon } from "./media-utils";

/** An in-flight upload, shown as a card in the grid until it completes. */
export interface ActiveUpload {
  id: string;
  name: string;
  progress: number;
  error?: string;
  size: number;
  type: string;
  /** Current stage: in-browser video transcode, or the S3 upload. */
  phase?: "converting" | "uploading";
  /** Upload + confirm finished; the card is dropped when the refetch lands. */
  done?: boolean;
}

function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6M9 9l6 6" />
    </svg>
  );
}

/** Filename without its extension, for the card title. */
function stripExt(name: string): string {
  return name.replace(/\.[^./\\]+$/, "") || name;
}

/**
 * Upload-in-progress tile. Mirrors `MediaCard`'s shape (HeroUI Card + thumbnail
 * area + caption) but the thumbnail shows a circular progress (or a failed
 * state) so in-flight uploads sit inline with the real media cards.
 */
export function MediaUploadCard({ upload }: { upload: ActiveUpload }) {
  const kind = kindFromMime(upload.type);
  const failed = Boolean(upload.error);
  // "Compressing" = in-browser video transcode; "Uploading" = sending to S3.
  const phaseLabel =
    upload.phase === "converting" ? "Compressing" : "Uploading";

  return (
    <Card className="relative w-full gap-0 overflow-hidden border border-border p-0">
      <div className="relative flex aspect-4/3 items-center justify-center bg-background">
        {failed ? (
          <div className="flex flex-col items-center gap-1 text-danger">
            <ErrorIcon className="size-9" />
            <span className="text-[10px] font-semibold uppercase tracking-wide">
              Failed
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <ProgressCircle
              value={upload.progress}
              aria-label={`${phaseLabel} ${upload.name}`}
              size="lg"
              color="accent"
              className="relative"
            >
              <ProgressCircle.Track>
                <ProgressCircle.TrackCircle />
                <ProgressCircle.FillCircle />
              </ProgressCircle.Track>
            </ProgressCircle>
            <p className="flex items-center justify-center text-sm font-semibold text-foreground">
              {upload.progress}%
            </p>
            {/* Make the current stage obvious: compressing vs uploading. */}
            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-accent">
              {upload.phase === "converting" && (
                <span
                  className="size-1.5 animate-pulse rounded-full bg-accent"
                  aria-hidden
                />
              )}
              {phaseLabel}…
            </span>
          </div>
        )}
      </div>

      {/* Caption row — matches MediaCard */}
      <Card.Content className="gap-0.5 p-2">
        <p className="truncate text-xs font-medium text-foreground">
          {stripExt(upload.name)}
        </p>
        <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted">
          <KindIcon kind={kind} className="size-3.5 shrink-0" />
          <span className="truncate">
            {failed ? upload.error : formatBytes(upload.size)}
          </span>
        </p>
      </Card.Content>
    </Card>
  );
}
