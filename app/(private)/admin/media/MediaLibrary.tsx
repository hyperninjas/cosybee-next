"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  Input,
  Pagination,
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
import type { Tag } from "@/app/lib/article-types";
import { FolderSidebar, type FolderSelection } from "./FolderSidebar";
import { MediaDetailModal } from "./MediaDetailModal";
import { MediaCard } from "./MediaCard";
import { MediaTable } from "./MediaTable";
import { MediaEmptyState } from "./MediaEmptyState";
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

const PAGE_SIZE = 40;

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

interface ActiveUpload {
  id: string;
  name: string;
  progress: number;
  error?: string;
}

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
      pageSize: PAGE_SIZE,
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
        if (!cancelled) setResult(r);
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
  }, [page, kind, debouncedQ, selected, tagFilter, reloadKey]);

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

    let completed = 0;
    await Promise.all(
      list.map(async (file, i) => {
        const id = `${Date.now()}-${i}-${file.name}`;
        const problem = validateLibraryFile(file);
        if (problem) {
          toast.danger(`${file.name}: ${problem}`);
          return;
        }
        setUploads((u) => [...u, { id, name: file.name, progress: 0 }]);
        try {
          await uploadLibraryFile(
            file,
            { folderId: folderForUpload },
            {
              onProgress: (p) =>
                setUploads((u) =>
                  u.map((x) => (x.id === id ? { ...x, progress: p } : x)),
                ),
            },
          );
          completed += 1;
        } catch (e) {
          setUploads((u) =>
            u.map((x) =>
              x.id === id ? { ...x, error: (e as Error).message } : x,
            ),
          );
          toast.danger(
            `${file.name}: ${(e as Error).message || "upload failed"}`,
          );
          return;
        }
        // Drop the finished row after a short beat.
        setTimeout(() => setUploads((u) => u.filter((x) => x.id !== id)), 800);
      }),
    );

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
            accept="image/*,video/mp4,video/webm,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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
        <FolderSidebar
          folders={folders}
          selected={selected}
          onSelect={selectScope}
          onChanged={refreshFolders}
        />

        <div className="min-w-0 flex-1 space-y-4">
          {/* Toolbar: kind filter + search + tag filter + view toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <Tabs
                selectedKey={kind}
                onSelectionChange={(k) => selectKind(k as "ALL" | MediaKind)}
              >
                <Tabs.ListContainer>
                  <Tabs.List
                    aria-label="View mode"
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
                className="w-full sm:w-56"
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
            className={`relative rounded-xl border-2 border-dashed p-3 sm:p-0 transition-colors ${
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
            ) : items.length === 0 ? (
              <MediaEmptyState
                filtered={isFiltered}
                onUpload={() => fileInputRef.current?.click()}
                onClear={clearFilters}
              />
            ) : view === "grid" ? (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
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
              <MediaTable
                items={items}
                folders={folders}
                onOpen={openDetail}
                onDeleted={handleDeleted}
              />
            )}
          </div>

          {/* Active upload progress */}
          {uploads.length > 0 && (
            <ul className="space-y-1.5">
              {uploads.map((u) => (
                <li
                  key={u.id}
                  className="rounded-lg border border-border bg-surface px-3 py-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="min-w-0 flex-1 truncate text-foreground">
                      {u.name}
                    </span>
                    <span className="text-muted">
                      {u.error ? "Failed" : `${u.progress}%`}
                    </span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded bg-background">
                    <div
                      className={`h-full transition-all ${u.error ? "bg-danger" : "bg-accent"}`}
                      style={{ width: `${u.error ? 100 : u.progress}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Pagination */}
          {total > 0 && totalPages > 1 && (
            <Pagination size="sm" className="w-full flex-wrap gap-2">
              <Pagination.Summary>
                Page {result?.page ?? 1} of {totalPages} · {total} files
              </Pagination.Summary>
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
