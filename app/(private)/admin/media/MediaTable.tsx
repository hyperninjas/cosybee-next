"use client";

import { useState } from "react";
import NextImage from "next/image";
import { TrashBin } from "@gravity-ui/icons";
import {
  Button,
  Chip,
  Table,
  toast,
  Tooltip,
  useOverlayState,
} from "@heroui/react";
import {
  deleteLibraryMedia,
  type MediaFolder,
  type MediaItem,
} from "@/app/lib/storage";
import {
  copyToClipboard,
  formatBytes,
  KindIcon,
  VideoThumb,
} from "./media-utils";
import { ConfirmDialog } from "./ConfirmDialog";
import { MediaEmptyState } from "./MediaEmptyState";

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

function Thumb({ media }: { media: MediaItem }) {
  const thumb = media.thumbnailUrl ?? (media.kind === "image" ? media.url : null);
  return (
    <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
      {thumb ? (
        <NextImage
          src={thumb}
          alt={media.alt ?? media.name ?? ""}
          fill
          unoptimized
          sizes="40px"
          className="object-cover"
        />
      ) : media.kind === "video" && media.url ? (
        <VideoThumb url={media.url} className="size-full object-cover" />
      ) : (
        <KindIcon kind={media.kind} className="size-5 text-muted" />
      )}
    </div>
  );
}

export function MediaTable({
  items,
  folders,
  onOpen,
  onDeleted,
}: {
  items: MediaItem[];
  folders: MediaFolder[];
  onOpen: (m: MediaItem) => void;
  onDeleted: (id: string) => void;
}) {
  const folderName = new Map(folders.map((f) => [f.id, f.name]));
  const deleteOverlay = useOverlayState();
  const [deleting, setDeleting] = useState<MediaItem | null>(null);

  // Precompute display strings here (during render) — NOT inside the Table.Body
  // render prop, which runs outside render and trips the React Compiler when it
  // calls module helpers like `formatBytes` (see PostsTable for the same note).
  const rows = items.map((m) => ({
    id: m.id,
    media: m,
    sizeLabel: formatBytes(m.sizeBytes),
    updatedLabel: new Date(m.updatedAt).toLocaleDateString(),
    folderLabel: m.folderId ? (folderName.get(m.folderId) ?? "—") : "—",
  }));

  async function copyUrl(url: string | null) {
    if (!url) return;
    const ok = await copyToClipboard(url);
    if (ok) toast.success("URL copied");
    else toast.danger("Could not copy URL");
  }

  function askDelete(m: MediaItem) {
    setDeleting(m);
    deleteOverlay.open();
  }

  return (
    <>
      <Table>
        <Table.ScrollContainer className="overflow-x-auto">
          <Table.Content aria-label="Media library" className="min-w-200">
            <Table.Header>
              <Table.Column isRowHeader>File</Table.Column>
              <Table.Column>Type</Table.Column>
              <Table.Column className="min-w-25">Alt text</Table.Column>
              <Table.Column className="min-w-25">Size</Table.Column>
              <Table.Column>Folder</Table.Column>
              <Table.Column>Tags</Table.Column>
              <Table.Column className="text-center">Used</Table.Column>
              <Table.Column>Updated</Table.Column>
              <Table.Column className="text-end">Actions</Table.Column>
            </Table.Header>
            <Table.Body
              items={rows}
              renderEmptyState={() => <MediaEmptyState filtered />}
            >
              {(row) => {
                const m = row.media;
                // In use by post, author avatar, or provider logo — blocks delete.
                const inUse =
                  m.usages.length +
                  m.authorUsages.length +
                  m.providerUsages.length;
                return (
                  <Table.Row
                    id={row.id}
                    onAction={() => onOpen(m)}
                    className="cursor-pointer"
                  >
                    <Table.Cell>
                      <div className="flex items-center gap-3">
                        <Thumb media={m} />
                        <span className="min-w-0 max-w-55 truncate font-medium text-foreground">
                          {m.name ?? m.key}
                        </span>
                      </div>
                    </Table.Cell>
                    <Table.Cell className="text-muted">
                      {m.kind ?? "file"}
                    </Table.Cell>
                    <Table.Cell className="text-muted">
                      {m.alt ? (
                        <span className="block max-w-55 truncate" title={m.alt}>
                          {m.alt}
                        </span>
                      ) : (
                        "—"
                      )}
                    </Table.Cell>
                    <Table.Cell className="text-muted">
                      {row.sizeLabel}
                    </Table.Cell>
                    <Table.Cell className="text-muted">
                      {row.folderLabel}
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex max-w-50 flex-wrap gap-1">
                        {m.tags.slice(0, 3).map((t) => (
                          <Chip
                            key={t.id}
                            size="sm"
                            variant="soft"
                            color="default"
                          >
                            #{t.name}
                          </Chip>
                        ))}
                        {m.tags.length > 3 && (
                          <span className="text-[10px] text-muted">
                            +{m.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell className="text-center">
                      {inUse > 0 ? (
                        <Chip size="sm" color="accent" title={`In use (${inUse})`}>
                          {inUse}
                        </Chip>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </Table.Cell>
                    <Table.Cell className="text-xs text-muted">
                      {row.updatedLabel}
                    </Table.Cell>
                    <Table.Cell className="text-end">
                      <div className="flex items-center justify-end gap-1">
                        {m.url && (
                          <Tooltip delay={300}>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="ghost"
                              aria-label="Copy URL"
                              onPress={() => copyUrl(m.url)}
                            >
                              <CopyIcon className="size-4" />
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
                            isDisabled={inUse > 0}
                            onPress={() => askDelete(m)}
                            className="hover:text-danger"
                          >
                            <TrashBin className="size-4" />
                          </Button>
                          <Tooltip.Content>
                            {inUse > 0 ? "In use — can't delete" : "Delete"}
                          </Tooltip.Content>
                        </Tooltip>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                );
              }}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>

      <ConfirmDialog
        isOpen={deleteOverlay.isOpen}
        onOpenChange={deleteOverlay.setOpen}
        title={`Delete “${deleting?.name ?? deleting?.key ?? ""}”?`}
        description="This permanently removes the file from storage. This cannot be undone."
        onConfirm={async () => {
          if (!deleting) return;
          await deleteLibraryMedia(deleting);
          onDeleted(deleting.id);
          toast.success("Media deleted");
        }}
      />
    </>
  );
}
