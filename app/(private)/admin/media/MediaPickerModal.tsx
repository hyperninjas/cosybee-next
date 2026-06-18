"use client";

import { useEffect, useState } from "react";
import NextImage from "next/image";
import {
  Input,
  Modal,
  Pagination,
  Spinner,
  Tabs,
  Tooltip,
  toast,
} from "@heroui/react";
import {
  listMedia,
  listMediaTags,
  type MediaItem,
  type MediaKind,
  type MediaListResult,
  type MediaTagCount,
} from "@/app/lib/storage";
import { KindIcon, VideoThumb } from "./media-utils";
import { TagFilter } from "./TagFilter";

const PAGE_SIZE = 24;

const KIND_TABS = [
  { key: "ALL", label: "All" },
  { key: "image", label: "Images" },
  { key: "video", label: "Video" },
  { key: "pdf", label: "PDF" },
  { key: "document", label: "Docs" },
] as const;

/** A selectable tile in the picker grid. */
function PickerTile({
  media,
  onPick,
}: {
  media: MediaItem;
  onPick: (m: MediaItem) => void;
}) {
  const thumb =
    media.thumbnailUrl ?? (media.kind === "image" ? media.url : null);
  const name = media.name ?? media.key;
  return (
    <Tooltip delay={500}>
      <button
        type="button"
        onClick={() => onPick(media)}
        aria-label={name}
        className="group block w-full cursor-pointer overflow-hidden rounded-lg border border-border bg-surface text-left transition hover:border-accent hover:shadow-md"
      >
        <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-background">
          {thumb ? (
            <NextImage
              src={thumb}
              alt={media.alt ?? media.name ?? ""}
              fill
              unoptimized
              sizes="(max-width: 640px) 50vw, 200px"
              className="object-cover"
              {...(media.blurDataUrl
                ? {
                    placeholder: "blur" as const,
                    blurDataURL: media.blurDataUrl,
                  }
                : {})}
            />
          ) : media.kind === "video" && media.url ? (
            <VideoThumb url={media.url} className="size-full object-cover" />
          ) : (
            <KindIcon kind={media.kind} className="size-9 text-muted" />
          )}
        </div>
        <div className="flex items-start gap-1.5 p-2">
          <KindIcon
            kind={media.kind}
            className="mt-px size-3.5 shrink-0 text-muted"
          />
          {/* Always reserve two lines so every tile is the same height. */}
          <span className="line-clamp-2 min-h-[2lh] text-xs font-medium text-foreground">
            {name}
          </span>
        </div>
      </button>
      <Tooltip.Content>{name}</Tooltip.Content>
    </Tooltip>
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
  const [tagFilter, setTagFilter] = useState<Set<string>>(() => new Set());
  const [mediaTags, setMediaTags] = useState<MediaTagCount[]>([]);
  const [page, setPage] = useState(1);
  // No separate `loading` flag — we show the spinner while `result` is null and
  // just swap the grid in place on refetch. Keeps all setState in async
  // callbacks (the lint rule forbids synchronous setState in an effect body).
  const [result, setResult] = useState<MediaListResult | null>(null);

  // Tags (with counts) for the filter — fetched once when the picker opens.
  useEffect(() => {
    let cancelled = false;
    listMediaTags()
      .then((r) => {
        if (!cancelled) setMediaTags(r.items);
      })
      .catch(() => {
        /* non-fatal — filter just shows nothing */
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
      tagIds: tagFilter.size > 0 ? [...tagFilter] : undefined,
    })
      .then((r) => {
        if (!cancelled) setResult(r);
      })
      .catch((e) => {
        if (!cancelled)
          toast.danger((e as Error).message || "Could not load media");
      });
    return () => {
      cancelled = true;
    };
  }, [page, kind, debouncedQ, accept, tagFilter]);

  const items = result?.items ?? [];
  const total = result?.total ?? 0;
  const totalPages = result?.totalPages ?? 1;
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);
  const showNumbered = totalPages > 1 && totalPages <= 7;

  return (
    // Fixed-height flex column: the filter bar + pagination stay pinned while
    // only the grid scrolls, so the modal never grows past the viewport.
    <Modal.Body className="flex max-h-[72vh] flex-col gap-4 overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        {!accept && (
          <Tabs
            selectedKey={kind}
            onSelectionChange={(k) => {
              setKind(k as "ALL" | MediaKind);
              setPage(1);
            }}
          >
            <Tabs.ListContainer>
              <Tabs.List
                aria-label="Filter by type"
                className="w-fit *:h-7 *:w-fit *:px-2"
              >
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
        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
          <TagFilter
            tags={mediaTags}
            selected={tagFilter}
            onChange={(next) => {
              setTagFilter(next);
              setPage(1);
            }}
          />
          <Input
            aria-label="Search media"
            variant="secondary"
            placeholder="Search name, alt, file…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64"
          />
        </div>
      </div>

      {/* Scroll region — the only part that scrolls. `min-h-0` lets it shrink
          inside the flex column so `overflow-y-auto` actually kicks in. */}
      <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
        {!result ? (
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        ) : items.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted">
            No media found. Upload files in the Media library first.
          </p>
        ) : (
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-4">
            {items.map((m) => (
              <li key={m.id}>
                <PickerTile media={m} onPick={onPick} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {total > 0 && (
        <Pagination
          size="sm"
          className="shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border pt-3"
        >
          <Pagination.Summary>
            {rangeStart}–{rangeEnd} of {total}
          </Pagination.Summary>
          {totalPages > 1 && (
            <Pagination.Content>
              <Pagination.Item>
                <Pagination.Previous
                  isDisabled={page <= 1}
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <Pagination.PreviousIcon /> Prev
                </Pagination.Previous>
              </Pagination.Item>

              {showNumbered &&
                Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Pagination.Item key={p} className="hidden sm:flex">
                    <Pagination.Link
                      isActive={p === page}
                      onPress={() => setPage(p)}
                    >
                      {p}
                    </Pagination.Link>
                  </Pagination.Item>
                ))}

              <Pagination.Item>
                <Pagination.Next
                  isDisabled={page >= totalPages}
                  onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next <Pagination.NextIcon />
                </Pagination.Next>
              </Pagination.Item>
            </Pagination.Content>
          )}
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
          {/* Width lives on the dialog (`.modal__dialog--lg` sets max-width).
              Override it here — `!` (Tailwind v4 important) beats that class. */}
          <Modal.Dialog className="max-w-4xl!">
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
