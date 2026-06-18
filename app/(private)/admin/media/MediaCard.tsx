"use client";

import NextImage from "next/image";
import { TrashBin } from "@gravity-ui/icons";
import {
  Button,
  Card,
  Chip,
  toast,
  Tooltip,
  useOverlayState,
} from "@heroui/react";
import { deleteObject, type MediaItem } from "@/app/lib/storage";
import {
  copyToClipboard,
  formatBytes,
  KindIcon,
  VideoThumb,
} from "./media-utils";
import { ConfirmDialog } from "./ConfirmDialog";

function CopyIcon({ className }: { className?: string }) {
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
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

/** A single media tile in the gallery grid (HeroUI Card). */
export function MediaCard({
  media,
  onOpen,
  onDeleted,
}: {
  media: MediaItem;
  onOpen: (m: MediaItem) => void;
  onDeleted: (id: string) => void;
}) {
  const uses = media.usages.length;
  const deleteOverlay = useOverlayState();

  async function copyUrl() {
    if (!media.url) return;
    const ok = await copyToClipboard(media.url);
    if (ok) toast.success("URL copied");
    else toast.danger("Could not copy URL");
  }

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onOpen(media)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(media);
        }
      }}
      className="group relative w-full cursor-pointer gap-0 overflow-hidden border border-border p-0 transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {/* Thumbnail */}
      <div className="relative flex aspect-4/3 items-center justify-center overflow-hidden bg-background">
        {media.kind === "image" && media.url ? (
          <NextImage
            src={media.url}
            alt={media.alt ?? media.name ?? ""}
            fill
            unoptimized
            sizes="(max-width: 640px) 50vw, 20vw"
            className="object-cover transition-transform group-hover:scale-[1.03]"
          />
        ) : media.kind === "video" && media.url ? (
          <VideoThumb url={media.url} className="size-full object-cover" />
        ) : (
          <KindIcon kind={media.kind} className="size-10 text-muted" />
        )}

        {/* Usage badge (top-right) — how many places it's used */}
        {uses > 0 && (
          <Chip
            size="sm"
            color="accent"
            title={`Used in ${uses} ${uses === 1 ? "post" : "posts"}`}
            className="absolute right-1.5 top-1.5 shadow-sm"
          >
            {uses}
          </Chip>
        )}

        {/* Hover action bar (bottom-right): copy + delete. Each stops the click
            so it doesn't also open the detail modal. */}
        <div className="absolute bottom-1.5 right-1.5 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          {media.url && (
            <Tooltip delay={300}>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                aria-label="Copy URL"
                onPress={copyUrl}
                onClick={(e) => e.stopPropagation()}
                className="size-7 min-w-0 bg-black/55 text-white hover:bg-black/75"
              >
                <CopyIcon className="size-3.5" />
              </Button>
              <Tooltip.Content>Copy URL</Tooltip.Content>
            </Tooltip>
          )}
          <Tooltip delay={300}>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              aria-label="Delete"
              isDisabled={uses > 0}
              onPress={() => deleteOverlay.open()}
              onClick={(e) => e.stopPropagation()}
              className="size-7 min-w-0 bg-black/55 text-white hover:bg-danger"
            >
              <TrashBin className="size-3.5" />
            </Button>
            <Tooltip.Content>
              {uses > 0 ? "In use — can't delete" : "Delete"}
            </Tooltip.Content>
          </Tooltip>
        </div>

        {/* Hover overlay: tags (legible over the dark gradient backdrop) */}
        {media.tags.length > 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap gap-1 bg-linear-to-t from-black/70 to-transparent p-2 pt-6 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            {media.tags.slice(0, 4).map((t) => (
              <Chip key={t.id} size="sm" variant="soft" color="default">
                #{t.name}
              </Chip>
            ))}
            {media.tags.length > 4 && (
              <Chip size="sm" variant="soft" color="default">
                +{media.tags.length - 4}
              </Chip>
            )}
          </div>
        )}
      </div>

      {/* Caption row */}
      <Card.Content className="gap-0.5 p-2">
        <p className="truncate text-xs font-medium text-foreground">
          {media.name ?? media.key}
        </p>
        <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted">
          <KindIcon kind={media.kind} className="size-3.5 shrink-0" />
          <span>{formatBytes(media.sizeBytes)}</span>
        </p>
      </Card.Content>

      <ConfirmDialog
        isOpen={deleteOverlay.isOpen}
        onOpenChange={deleteOverlay.setOpen}
        title={`Delete “${media.name ?? media.key}”?`}
        description="This permanently removes the file from storage. This cannot be undone."
        onConfirm={async () => {
          await deleteObject(media.key);
          onDeleted(media.id);
          toast.success("Media deleted");
        }}
      />
    </Card>
  );
}
