"use client";

import { useEffect, useState } from "react";
import NextImage from "next/image";
import { Input, Modal, Pagination, Spinner, Tabs, toast } from "@heroui/react";
import {
  listMedia,
  type MediaItem,
  type MediaKind,
  type MediaListResult,
} from "@/app/lib/storage";
import { formatBytes, KindIcon, VideoThumb } from "./media-utils";

const PAGE_SIZE = 24;

const KIND_TABS = [
  { key: "ALL", label: "All" },
  { key: "image", label: "Images" },
  { key: "video", label: "Video" },
  { key: "pdf", label: "PDF" },
  { key: "document", label: "Docs" },
] as const;

/** A selectable tile in the picker grid. */
function PickerTile({ media, onPick }: { media: MediaItem; onPick: (m: MediaItem) => void }) {
  const thumb = media.thumbnailUrl ?? (media.kind === "image" ? media.url : null);
  return (
    <button
      type="button"
      onClick={() => onPick(media)}
      className="group block w-full cursor-pointer overflow-hidden rounded-lg border border-border bg-surface text-left transition hover:border-accent hover:shadow-md"
    >
      <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-background">
        {thumb ? (
          <NextImage
            src={thumb}
            alt={media.alt ?? media.name ?? ""}
            fill
            unoptimized
            sizes="(max-width: 640px) 50vw, 160px"
            className="object-cover"
            {...(media.blurDataUrl
              ? { placeholder: "blur" as const, blurDataURL: media.blurDataUrl }
              : {})}
          />
        ) : media.kind === "video" && media.url ? (
          <VideoThumb url={media.url} className="size-full object-cover" />
        ) : (
          <KindIcon kind={media.kind} className="size-9 text-muted" />
        )}
      </div>
      <div className="space-y-0.5 p-2">
        <p className="truncate text-xs font-medium text-foreground">{media.name ?? media.key}</p>
        <p className="text-[10px] uppercase tracking-wide text-muted">
          {media.kind ?? "file"} · {formatBytes(media.sizeBytes)}
        </p>
      </div>
    </button>
  );
}

/**
 * The picker body — only mounted while the modal is open (so its fetch runs
 * once on open + on filter changes, and state resets each open). Single-select.
 */
function PickerBody({
  accept,
  onPick,
}: {
  accept?: MediaKind;
  onPick: (media: MediaItem) => void;
}) {
  const [search, setSearch] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [kind, setKind] = useState<"ALL" | MediaKind>(accept ?? "ALL");
  const [page, setPage] = useState(1);
  // No separate `loading` flag — we show the spinner while `result` is null and
  // just swap the grid in place on refetch. Keeps all setState in async
  // callbacks (the lint rule forbids synchronous setState in an effect body).
  const [result, setResult] = useState<MediaListResult | null>(null);

  // Debounce search; reset to page 1.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    listMedia({
      page,
      pageSize: PAGE_SIZE,
      kind: accept ?? (kind === "ALL" ? undefined : kind),
      q: debouncedQ || undefined,
    })
      .then((r) => {
        if (!cancelled) setResult(r);
      })
      .catch((e) => {
        if (!cancelled) toast.danger((e as Error).message || "Could not load media");
      });
    return () => {
      cancelled = true;
    };
  }, [page, kind, debouncedQ, accept]);

  const items = result?.items ?? [];
  const totalPages = result?.totalPages ?? 1;

  return (
    <Modal.Body className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {!accept && (
          <Tabs
            selectedKey={kind}
            onSelectionChange={(k) => {
              setKind(k as "ALL" | MediaKind);
              setPage(1);
            }}
          >
            <Tabs.ListContainer>
              <Tabs.List aria-label="Filter by type" className="w-fit *:h-7 *:w-fit *:px-2">
                {KIND_TABS.map((t) => (
                  <Tabs.Tab key={t.key} id={t.key}>
                    {t.label}
                    <Tabs.Indicator className="rounded-xl bg-accent" />
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>
        )}
        <Input
          aria-label="Search media"
          variant="secondary"
          placeholder="Search name, alt, file…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64"
        />
      </div>

      {!result ? (
        <div className="flex items-center justify-center py-16">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">
          No media found. Upload files in the Media library first.
        </p>
      ) : (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {items.map((m) => (
            <li key={m.id}>
              <PickerTile media={m} onPick={onPick} />
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <Pagination size="sm" className="justify-end gap-2">
          <Pagination.Content>
            <Pagination.Item>
              <Pagination.Previous
                isDisabled={page <= 1}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
              >
                <Pagination.PreviousIcon /> Prev
              </Pagination.Previous>
            </Pagination.Item>
            <Pagination.Item>
              <Pagination.Next
                isDisabled={page >= totalPages}
                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next <Pagination.NextIcon />
              </Pagination.Next>
            </Pagination.Item>
          </Pagination.Content>
        </Pagination>
      )}
    </Modal.Body>
  );
}

/**
 * A modal picker over the media library — search + kind filter + paginated
 * grid, single-select. Reusable for the editor's "Media library" slash command
 * and the cover/OG image pickers. Pass `accept` to lock it to one kind.
 */
export function MediaPickerModal({
  isOpen,
  onOpenChange,
  onSelect,
  accept,
  heading = "Insert from media library",
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (media: MediaItem) => void;
  accept?: MediaKind;
  heading?: string;
}) {
  function pick(media: MediaItem) {
    onSelect(media);
    onOpenChange(false);
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container size="lg" scroll="inside">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading className="text-lg font-extrabold text-foreground">
                {heading}
              </Modal.Heading>
            </Modal.Header>
            {isOpen && <PickerBody accept={accept} onPick={pick} />}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
