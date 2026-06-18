"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  Input,
  ListBox,
  ListBoxItem,
  Pagination,
  Select,
  Spinner,
  Tabs,
  toast,
  Tooltip,
  useOverlayState,
} from "@heroui/react";
import {
  listFolders,
  listMedia,
  listMediaTags,
  uploadLibraryFile,
  validateLibraryFile,
  type MediaFolder,
  type MediaItem,
  type MediaKind,
  type MediaListResult,
  type MediaTagCount,
} from "@/app/lib/storage";
import { isTranscodableVideo, transcodeToMp4 } from "@/app/lib/media-video";
import type { Tag } from "@/app/lib/article-types";
import { FolderSidebar, type FolderSelection } from "./FolderSidebar";
import { MediaDetailModal } from "./MediaDetailModal";
import { MediaCard } from "./MediaCard";
import { MediaTable } from "./MediaTable";
import { MediaEmptyState } from "./MediaEmptyState";
import { MediaUploadCard, type ActiveUpload } from "./MediaUploadCard";
import { TagFilter } from "./TagFilter";

type ViewMode = "grid" | "table";

function GridIcon({ className }: { className?: string }) {
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
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function ListIcon({ className }: { className?: string }) {
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
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
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
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

const DEFAULT_PAGE_SIZE = 40;
const PAGE_SIZE_OPTIONS = [20, 40, 60, 100] as const;

const KIND_TABS = [
  { key: "ALL", label: "All" },
  { key: "image", label: "Images" },
  { key: "video", label: "Video" },
  { key: "pdf", label: "PDF" },
  { key: "document", label: "Docs" },
] as const;

const VIEW_MODES = [
  { key: "grid", label: "Grid view", icon: GridIcon },
  { key: "table", label: "Table view", icon: ListIcon },
] as const;

export function MediaLibrary({ allTags }: { allTags: Tag[] }) {
  // Tag vocabulary held in state so tags created from the detail editor appear
  // in the filter/toggles immediately (the prop is a server-fetched snapshot).
  const [tags, setTags] = useState<Tag[]>(allTags);
  // Tags actually applied to library media, with file counts — drives the tag
  // filter (so each option shows how many files carry it).
  const [mediaTags, setMediaTags] = useState<MediaTagCount[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [selected, setSelected] = useState<FolderSelection>("all");
  const [kind, setKind] = useState<"ALL" | MediaKind>("ALL");
  const [search, setSearch] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [tagFilter, setTagFilter] = useState<Set<string>>(() => new Set());
  const [view, setView] = useState<ViewMode>("grid");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  const [result, setResult] = useState<MediaListResult | null>(null);
  const [loading, setLoading] = useState(true);

  const [uploads, setUploads] = useState<ActiveUpload[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const detailOverlay = useOverlayState();
  const [detail, setDetail] = useState<MediaItem | null>(null);

  // Bumping this forces the media list to refetch (e.g. after an upload),
  // without smuggling the fetch through a callback's identity.
  const [reloadKey, setReloadKey] = useState(0);

  // Stable refetcher for the folder tree — called on mount and after any
  // folder/media mutation that changes counts.
  const refreshFolders = useCallback(() => {
    listFolders()
      .then((r) => setFolders(r.items))
      .catch(() => {
        /* non-fatal — sidebar just shows what it has */
      });
  }, []);

  // Refetch the tag-with-counts list — on mount and after any change that can
  // alter which tags are applied to media (upload, edit, delete).
  const refreshMediaTags = useCallback(() => {
    listMediaTags()
      .then((r) => setMediaTags(r.items))
      .catch(() => {
        /* non-fatal — filter just shows what it has */
      });
  }, []);

  // Filter changes go through these so page resets to 1 in the SAME render —
  // one batched state update, so the fetch effect below runs exactly once.
  const selectScope = useCallback((key: FolderSelection) => {
    setSelected(key);
    setPage(1);
  }, []);
  const selectKind = useCallback((k: "ALL" | MediaKind) => {
    setKind(k);
    setPage(1);
  }, []);

  // Re-run the current query (same filters/page) and refresh the folder + tag
  // counts. Bumping `reloadKey` re-triggers the fetch effect below.
  const refresh = useCallback(() => {
    setReloadKey((k) => k + 1);
    refreshFolders();
    refreshMediaTags();
  }, [refreshFolders, refreshMediaTags]);

  // Debounce the search box; reset to page 1 with the new query.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // The data fetch lives directly in the effect with its real reactive deps —
  // no useCallback indirection. A cancellation flag drops stale responses when
  // filters change mid-request.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listMedia({
      page,
      pageSize,
      kind: kind === "ALL" ? undefined : kind,
      q: debouncedQ || undefined,
      folderId:
        typeof selected === "string" &&
        selected !== "all" &&
        selected !== "unfiled"
          ? selected
          : undefined,
      unfiled: selected === "unfiled" || undefined,
      tagIds: tagFilter.size > 0 ? [...tagFilter] : undefined,
    })
      .then((r) => {
        if (!cancelled) {
          setResult(r);
          // The just-uploaded rows are now in the list — drop their finished
          // upload placeholders in the SAME render so the swap is seamless
          // (no lingering progress card overlapping the real one).
          setUploads((u) => u.filter((x) => !x.done));
        }
      })
      .catch((e) => {
        if (!cancelled)
          toast.danger((e as Error).message || "Could not load media");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, kind, debouncedQ, selected, tagFilter, reloadKey]);

  // Initial folder + tag-count load.
  useEffect(() => {
    refreshFolders();
    refreshMediaTags();
  }, [refreshFolders, refreshMediaTags]);

  // ── Uploads ──────────────────────────────────────────────────────────────
  const folderForUpload =
    typeof selected === "string" && selected !== "all" && selected !== "unfiled"
      ? selected
      : null;

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;

    // Validate + seed all cards upfront so the whole queue is visible.
    const queue: { file: File; id: string }[] = [];
    list.forEach((file, i) => {
      const problem = validateLibraryFile(file);
      if (problem) {
        toast.danger(`${file.name}: ${problem}`);
        return;
      }
      const id = `${Date.now()}-${i}-${file.name}`;
      setUploads((u) => [
        ...u,
        {
          id,
          name: file.name,
          progress: 0,
          size: file.size,
          type: file.type,
          phase: isTranscodableVideo(file) ? "converting" : "uploading",
        },
      ]);
      queue.push({ file, id });
    });

    const setProgress = (id: string, progress: number) =>
      setUploads((u) => u.map((x) => (x.id === id ? { ...x, progress } : x)));

    // Process sequentially — ffmpeg.wasm is a single shared instance, so video
    // transcodes can't overlap.
    let completed = 0;
    for (const { file, id } of queue) {
      try {
        let toUpload = file;
        // Videos are transcoded to a streamable MP4 in the browser first.
        if (isTranscodableVideo(file)) {
          toUpload = await transcodeToMp4(file, (p) => setProgress(id, p));
          setUploads((u) =>
            u.map((x) =>
              x.id === id ? { ...x, phase: "uploading", progress: 0 } : x,
            ),
          );
        }
        await uploadLibraryFile(
          toUpload,
          { folderId: folderForUpload },
          { onProgress: (p) => setProgress(id, p) },
        );
        completed += 1;
        // Mark done (full ring) but keep the card — it's removed atomically when
        // the post-upload refetch lands, so the placeholder swaps for the real
        // card without a flicker.
        setUploads((u) =>
          u.map((x) => (x.id === id ? { ...x, progress: 100, done: true } : x)),
        );
      } catch (e) {
        setUploads((u) =>
          u.map((x) =>
            x.id === id ? { ...x, error: (e as Error).message } : x,
          ),
        );
        toast.danger(
          `${file.name}: ${(e as Error).message || "upload failed"}`,
        );
      }
    }

    if (completed > 0) {
      toast.success(`Uploaded ${completed} file${completed === 1 ? "" : "s"}`);
      setReloadKey((k) => k + 1);
      refreshFolders();
      refreshMediaTags();
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  }

  function openDetail(item: MediaItem) {
    setDetail(item);
    detailOverlay.open();
  }

  // Any active narrowing (search, kind, tag, or folder scope) — drives the
  // "no results" vs "empty library" copy in the empty state.
  const isFiltered =
    debouncedQ !== "" ||
    kind !== "ALL" ||
    tagFilter.size > 0 ||
    selected !== "all";

  function clearFilters() {
    setSearch("");
    setDebouncedQ("");
    setKind("ALL");
    setTagFilter(new Set());
    setSelected("all");
    setPage(1);
  }

  // Shared by the card delete and the detail-modal delete: drop the row from
  // the current page and refresh folder/tag counts.
  const handleDeleted = useCallback(
    (id: string) => {
      setResult((r) =>
        r
          ? {
              ...r,
              items: r.items.filter((x) => x.id !== id),
              total: r.total - 1,
            }
          : r,
      );
      refreshFolders();
      refreshMediaTags();
    },
    [refreshFolders, refreshMediaTags],
  );

  const items = result?.items ?? [];
  const totalPages = result?.totalPages ?? 1;
  const total = result?.total ?? 0;

  // Pagination display helpers (mirror PostsTable's footer).
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);
  const showNumbered = totalPages > 1 && totalPages <= 7;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Media library</h1>
          <p className="mt-1 text-sm text-muted">{total} files</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            hidden
            accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <Button
            variant="primary"
            onPress={() => fileInputRef.current?.click()}
          >
            Upload
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-6 sm:flex-row">
        {/* Sticky on desktop so the folder tree stays in view while the grid
            scrolls. `self-start` keeps it content-height inside the flex row. */}
        <div className="sm:sticky sm:top-20 sm:max-h-[calc(100vh-6rem)] sm:self-start sm:overflow-y-auto">
          <FolderSidebar
            folders={folders}
            selected={selected}
            onSelect={selectScope}
            onChanged={refreshFolders}
          />
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          {/* Toolbar: kind filter + view toggle on one tier; tag filter,
              refresh + search on another. Collapses to stacked rows on
              narrow screens and lines up on a single row from xl up. */}
          <div className="flex flex-col lg:flex-row gap-3 lg:flex-wrap lg:items-center lg:justify-between">
            {/* Kind filter + grid/table toggle. Kind tabs scroll sideways if
                they ever outgrow the row instead of wrapping mid-control. */}
            <div className="flex items-center justify-between gap-3">
              <Tabs
                selectedKey={kind}
                onSelectionChange={(k) => selectKind(k as "ALL" | MediaKind)}
                className="min-w-0"
              >
                <Tabs.ListContainer className="overflow-x-auto">
                  <Tabs.List
                    aria-label="Filter by type"
                    className="w-fit *:h-7 *:w-fit *:px-2 *:data-[selected=true]:text-accent-foreground"
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
              {/* Grid / table view toggle — same Tabs+Tooltip primitive as
                  PostsTable's view switch, over the gallery's view modes. */}
              <Tabs
                selectedKey={view}
                onSelectionChange={(k) => setView(k as ViewMode)}
              >
                <Tabs.ListContainer>
                  <Tabs.List
                    aria-label="View mode"
                    className="w-fit *:h-7 *:w-fit *:px-2 *:data-[selected=true]:text-accent-foreground"
                  >
                    {VIEW_MODES.map((v) => (
                      <Tooltip key={v.key} delay={300}>
                        <Tabs.Tab id={v.key} aria-label={v.label}>
                          <v.icon className="size-4" />
                          <Tabs.Indicator className="rounded-xl bg-accent" />
                        </Tabs.Tab>
                        <Tooltip.Content>{v.label}</Tooltip.Content>
                      </Tooltip>
                    ))}
                  </Tabs.List>
                </Tabs.ListContainer>
              </Tabs>
            </div>

            {/* Tag filter + refresh + search. Search takes the full width on
                its own row below the controls until there's room inline. */}
            <div className="flex flex-wrap items-center gap-2 lg:flex-1 lg:justify-end">
              <TagFilter
                tags={mediaTags}
                selected={tagFilter}
                onChange={(next) => {
                  setTagFilter(next);
                  setPage(1);
                }}
              />
              <Tooltip delay={300}>
                <Button
                  isIconOnly
                  variant="secondary"
                  aria-label="Refresh"
                  onPress={refresh}
                  isPending={loading}
                  className="shrink-0"
                >
                  <RefreshIcon className="size-4" />
                </Button>
                <Tooltip.Content>Refresh</Tooltip.Content>
              </Tooltip>
              <Input
                aria-label="Search media"
                variant="secondary"
                placeholder="Search name, alt, file…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full min-w-40 flex-1 sm:w-56 lg:flex-none"
              />
            </div>
          </div>

          {/* Grid / drop target */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`relative rounded-xl border-2 border-dashed p-0 sm:p-0 transition-colors ${
              dragging ? "border-accent bg-accent/5" : "border-transparent"
            }`}
          >
            {dragging && (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-accent/5 text-sm font-semibold text-accent">
                Drop files to upload
              </div>
            )}

            {loading && !result ? (
              <div className="flex items-center justify-center py-20">
                <Spinner />
              </div>
            ) : items.length === 0 && uploads.length === 0 ? (
              <MediaEmptyState
                filtered={isFiltered}
                onUpload={() => fileInputRef.current?.click()}
                onClear={clearFilters}
              />
            ) : view === "grid" ? (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
                {/* In-flight uploads sit inline with the real cards. */}
                {uploads.map((u) => (
                  <li key={u.id}>
                    <MediaUploadCard upload={u} />
                  </li>
                ))}
                {items.map((m) => (
                  <li key={m.id}>
                    <MediaCard
                      media={m}
                      onOpen={openDetail}
                      onDeleted={handleDeleted}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="space-y-3">
                {uploads.length > 0 && (
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
                    {uploads.map((u) => (
                      <li key={u.id}>
                        <MediaUploadCard upload={u} />
                      </li>
                    ))}
                  </ul>
                )}
                {items.length > 0 && (
                  <MediaTable
                    items={items}
                    folders={folders}
                    onOpen={openDetail}
                    onDeleted={handleDeleted}
                  />
                )}
              </div>
            )}
          </div>

          {/* Footer: per-page selector + pagination. */}
          {total > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-border pt-4">
              <Pagination size="sm" className="flex-wrap gap-2">
                <div className="flex items-center gap-2 text-sm text-muted">
                  <span>Per page</span>
                  <Select
                    aria-label="Items per page"
                    variant="secondary"
                    selectedKey={String(pageSize)}
                    onSelectionChange={(k) => {
                      setPageSize(Number(k));
                      setPage(1);
                    }}
                  >
                    <Select.Trigger className="w-20">
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {PAGE_SIZE_OPTIONS.map((n) => (
                          <ListBoxItem
                            key={n}
                            id={String(n)}
                            textValue={String(n)}
                          >
                            {n}
                          </ListBoxItem>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>
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
                      Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (p) => (
                          <Pagination.Item key={p} className="hidden sm:flex">
                            <Pagination.Link
                              isActive={p === page}
                              onPress={() => setPage(p)}
                            >
                              {p}
                            </Pagination.Link>
                          </Pagination.Item>
                        ),
                      )}

                    <Pagination.Item>
                      <Pagination.Next
                        isDisabled={page >= totalPages}
                        onPress={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                      >
                        Next <Pagination.NextIcon />
                      </Pagination.Next>
                    </Pagination.Item>
                  </Pagination.Content>
                )}
              </Pagination>
            </div>
          )}
        </div>
      </div>

      <MediaDetailModal
        media={detail}
        isOpen={detailOverlay.isOpen}
        onOpenChange={detailOverlay.setOpen}
        folders={folders}
        allTags={tags}
        onSaved={(updated) => {
          setResult((r) =>
            r
              ? {
                  ...r,
                  items: r.items.map((x) =>
                    x.id === updated.id ? updated : x,
                  ),
                }
              : r,
          );
          setDetail(updated);
          refreshFolders();
          refreshMediaTags();
          // Fold any newly-created tags into the local vocabulary so they show
          // in the filter/toggles without a page reload.
          setTags((prev) => {
            const known = new Set(prev.map((t) => t.id));
            const added = updated.tags
              .filter((t) => !known.has(t.id))
              .map((t) => ({
                id: t.id,
                name: t.name,
                slug: t.slug,
                description: null,
              }));
            return added.length
              ? [...prev, ...added].sort((a, b) => a.name.localeCompare(b.name))
              : prev;
          });
        }}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
