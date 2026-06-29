"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { Bars, HouseFill, LayoutCellsLarge, StarFill } from "@gravity-ui/icons";
import {
  Chip,
  EmptyState,
  Input,
  ListBox,
  ListBoxItem,
  Pagination,
  Select,
  Table,
  Tabs,
  Tooltip,
  toast,
} from "@heroui/react";
import { deletePost, setFeatured, setHomeFeatured, setStatus } from "./actions";
import { PostCard } from "./PostCard";
import { RowActions } from "./RowActions";
import {
  resolveCoverImage,
  type Category,
  type Tag,
} from "@/app/lib/article-types";

export type Row = {
  id: string;
  blog: string;
  slug: string;
  title: string;
  category: Category;
  tags: Tag[];
  status: string;
  featured: boolean;
  homeFeatured: boolean;
  coverImage: string | null;
  ogImage: string | null;
  updatedAt: string;
};

type Option = { id: string; label: string };

type SortKey = "updated-desc" | "updated-asc" | "title-asc" | "title-desc";

const BLOG_OPTIONS: Option[] = [
  { id: "all", label: "All blogs" },
  { id: "hive", label: "Hive" },
  { id: "learn", label: "Learn" },
];

/** Sort options for the posts list. */
const SORT_OPTIONS: Option[] = [
  { id: "updated-desc", label: "Recently updated" },
  { id: "updated-asc", label: "Oldest updated" },
  { id: "title-asc", label: "Title A–Z" },
  { id: "title-desc", label: "Title Z–A" },
];

/** Compact labelled <Select> used for the blog / category / tag / sort
 *  filters — mirrors the HeroUI Select composition so they all match. */
function FilterSelect({
  label,
  value,
  onChange,
  options,
  triggerClassName = "w-40",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  triggerClassName?: string;
}) {
  return (
    <Select
      aria-label={label}
      selectedKey={value}
      onSelectionChange={(k) => onChange(String(k))}
    >
      <Select.Trigger className={triggerClassName}>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {options.map((o) => (
            <ListBoxItem key={o.id} id={o.id} textValue={o.label}>
              {o.label}
            </ListBoxItem>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

/** Page sizes per view. Card view picks 12 so the grid lays out cleanly on
 *  every breakpoint (12 = 1×12, 2×6, 3×4 — no orphan card on the last row).
 *  Table view stays denser at 10 rows. */
const PAGE_SIZE_TABLE = 10;
const PAGE_SIZE_CARD = 12;

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type OptimisticAction =
  | { type: "status"; id: string; status: string }
  | { type: "featured"; id: string; featured: boolean }
  | { type: "homeFeatured"; id: string; homeFeatured: boolean }
  | { type: "delete"; id: string };

const TABS = [
  { key: "ALL", label: "All" },
  { key: "PUBLISHED", label: "Published" },
  { key: "DRAFT", label: "Drafts" },
] as const;

type ViewMode = "table" | "card";

const VIEW_MODES = [
  { key: "card", label: "Card view", icon: LayoutCellsLarge },
  { key: "table", label: "Table view", icon: Bars },
] as const;

export default function PostsTable({ rows }: { rows: Row[] }) {
  // Optimistic mirror of the server data: status flips and deletes apply
  // instantly, then reconcile when the server action revalidates `rows`.
  const [optimisticRows, applyOptimistic] = useOptimistic(
    rows,
    (state, action: OptimisticAction) => {
      if (action.type === "delete") {
        return state.filter((r) => r.id !== action.id);
      }
      return state.map((r) => {
        if (r.id !== action.id) return r;
        switch (action.type) {
          case "status":
            return { ...r, status: action.status };
          case "featured":
            return { ...r, featured: action.featured };
          case "homeFeatured":
            return { ...r, homeFeatured: action.homeFeatured };
        }
      });
    },
  );
  const [, startTransition] = useTransition();

  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("ALL");
  const [blog, setBlog] = useState<"all" | "hive" | "learn">("all");
  const [category, setCategory] = useState("all");
  const [tag, setTag] = useState("all");
  const [sort, setSort] = useState<SortKey>("updated-desc");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("card");

  // Card view uses a larger page so the grid (1/2/3 cols) doesn't end with
  // a short last row; table view stays denser. `safePage = min(page,
  // pageCount)` below already clamps the page index when the size shrinks,
  // so flipping views never strands the user past the last page.
  const pageSize = viewMode === "card" ? PAGE_SIZE_CARD : PAGE_SIZE_TABLE;

  const counts = useMemo(
    () => ({
      ALL: optimisticRows.length,
      PUBLISHED: optimisticRows.filter((r) => r.status === "PUBLISHED").length,
      DRAFT: optimisticRows.filter((r) => r.status === "DRAFT").length,
    }),
    [optimisticRows],
  );

  // Filter option lists derived from the loaded rows (scoped to the active
  // blog so the category/tag choices match what's actually selectable).
  const categoryNames = useMemo(() => {
    const set = new Set<string>();
    for (const r of optimisticRows) {
      if (blog !== "all" && r.blog !== blog) continue;
      if (r.category?.name) set.add(r.category.name);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [optimisticRows, blog]);

  const tagNames = useMemo(() => {
    const set = new Set<string>();
    for (const r of optimisticRows) {
      if (blog !== "all" && r.blog !== blog) continue;
      for (const t of r.tags ?? []) set.add(t.name);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [optimisticRows, blog]);

  const categoryOptions: Option[] = [
    { id: "all", label: "All categories" },
    ...categoryNames.map((n) => ({ id: n, label: n })),
  ];
  const tagOptions: Option[] = [
    { id: "all", label: "All tags" },
    ...tagNames.map((n) => ({ id: n, label: `#${n}` })),
  ];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = optimisticRows.filter((r) => {
      if (tab !== "ALL" && r.status !== tab) return false;
      if (blog !== "all" && r.blog !== blog) return false;
      if (category !== "all" && r.category?.name !== category) return false;
      if (tag !== "all" && !(r.tags ?? []).some((t) => t.name === tag))
        return false;
      if (
        q &&
        !`${r.title} ${r.slug} ${r.category?.name ?? ""} ${(r.tags ?? [])
          .map((t) => t.name)
          .join(" ")}`
          .toLowerCase()
          .includes(q)
      )
        return false;
      return true;
    });

    const byUpdated = (a: Row, b: Row) =>
      new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    return matched.sort((a, b) => {
      switch (sort) {
        case "updated-asc":
          return byUpdated(a, b);
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        case "updated-desc":
        default:
          return byUpdated(b, a);
      }
    });
  }, [optimisticRows, tab, blog, category, tag, query, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const shown = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  // Precompute display fields during render (NOT inside the Table render prop,
  // which runs outside render and would trip the React Compiler on the helpers).
  const items = shown.map((r) => ({
    ...r,
    imageUrl: resolveCoverImage(r.coverImage, r.ogImage),
    updatedLabel: relativeTime(r.updatedAt),
  }));

  const showNumbered = pageCount > 1 && pageCount <= 7;
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, filtered.length);

  function onToggleStatus(row: Row) {
    const next = row.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    const fd = new FormData();
    fd.append("id", row.id);
    fd.append("blog", row.blog);
    fd.append("slug", row.slug);
    fd.append("status", next);
    startTransition(async () => {
      applyOptimistic({ type: "status", id: row.id, status: next });
      const res = await setStatus(fd);
      if (res.ok) {
        toast.success(next === "PUBLISHED" ? "Post published" : "Moved to drafts");
      } else {
        toast.danger(res.error || "Couldn't update status");
      }
    });
  }

  function onToggleFeatured(row: Row) {
    const next = !row.featured;
    const fd = new FormData();
    fd.append("id", row.id);
    fd.append("blog", row.blog);
    fd.append("slug", row.slug);
    fd.append("featured", next ? "on" : "");
    startTransition(async () => {
      applyOptimistic({ type: "featured", id: row.id, featured: next });
      const res = await setFeatured(fd);
      if (res.ok) {
        toast.success(next ? "Added to carousel" : "Removed from carousel");
      } else {
        toast.danger(res.error || "Couldn't update featured");
      }
    });
  }

  function onToggleHomeFeatured(row: Row) {
    const next = !row.homeFeatured;
    const fd = new FormData();
    fd.append("id", row.id);
    fd.append("blog", row.blog);
    fd.append("slug", row.slug);
    fd.append("homeFeatured", next ? "on" : "");
    startTransition(async () => {
      applyOptimistic({ type: "homeFeatured", id: row.id, homeFeatured: next });
      const res = await setHomeFeatured(fd);
      if (res.ok) {
        toast.success(
          next ? "Added to home page" : "Removed from home page",
        );
      } else {
        toast.danger(res.error || "Couldn't update home feature");
      }
    });
  }

  function onDelete(row: Row) {
    const fd = new FormData();
    fd.append("id", row.id);
    fd.append("blog", row.blog);
    fd.append("slug", row.slug);
    startTransition(async () => {
      applyOptimistic({ type: "delete", id: row.id });
      const res = await deletePost(fd);
      if (res.ok) {
        toast.success("Post deleted");
      } else {
        toast.danger(res.error || "Couldn't delete post");
      }
    });
  }

  /** Pagination JSX shared by both views — same controls, same range
   *  summary. Wrapped here so the table can drop it into Table.Footer
   *  and the card grid can render it directly below the grid. */
  const paginationBlock = filtered.length > 0 && (
    <Pagination size="sm" className="w-full flex-wrap gap-2">
      <Pagination.Summary>
        Showing {rangeStart}–{rangeEnd} of {filtered.length} posts
      </Pagination.Summary>
      <Pagination.Content>
        <Pagination.Item>
          <Pagination.Previous
            isDisabled={safePage <= 1}
            onPress={() => setPage(Math.max(1, safePage - 1))}
          >
            <Pagination.PreviousIcon />
            Prev
          </Pagination.Previous>
        </Pagination.Item>

        {showNumbered &&
          Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
            <Pagination.Item key={p} className="hidden sm:flex">
              <Pagination.Link
                isActive={p === safePage}
                onPress={() => setPage(p)}
              >
                {p}
              </Pagination.Link>
            </Pagination.Item>
          ))}

        <Pagination.Item>
          <Pagination.Next
            isDisabled={safePage >= pageCount}
            onPress={() => setPage(Math.min(pageCount, safePage + 1))}
          >
            Next
            <Pagination.NextIcon />
          </Pagination.Next>
        </Pagination.Item>
      </Pagination.Content>
    </Pagination>
  );

  return (
    <div>
      {/* Filters: Tabs + Blog Select + Search + View toggle (on the page
          background → the default primary input variant is correct here). */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <Tabs
            // variant="primary"
            selectedKey={tab}
            onSelectionChange={(k) => {
              setTab(k as (typeof TABS)[number]["key"]);
              setPage(1);
            }}
            className="h-10!"
          >
            <Tabs.ListContainer>
              <Tabs.List
                aria-label="Options"
                className="w-fit *:h-7 *:w-fit *:px-3 *:text-sm *:font-normal *:data-[selected=true]:text-accent-foreground"
              >
                {TABS.map((t) => (
                  <Tabs.Tab key={t.key} id={t.key}>
                    {t.label}
                    <span className="ml-1.5 text-xs opacity-90">
                      {counts[t.key]}
                    </span>
                    <Tabs.Indicator className="bg-accent rounded-xl" />
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>
          {/* View toggle — same Tabs primitive (and same active-tab paint
              recipe) as the status filter above, just over view modes
              instead of statuses. Tooltips wrap each Tabs.Tab so the
              icon-only triggers stay discoverable. */}
          <Tabs
            selectedKey={viewMode}
            onSelectionChange={(k) => setViewMode(k as ViewMode)}
            className="h-10!"
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
                      <Tabs.Indicator className="bg-accent rounded-xl" />
                    </Tabs.Tab>
                    <Tooltip.Content>{v.label}</Tooltip.Content>
                  </Tooltip>
                ))}
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <FilterSelect
            label="Filter by blog"
            value={blog}
            onChange={(v) => {
              setBlog(v as typeof blog);
              // Category/tag choices are blog-scoped — reset them so a stale
              // selection from the previous blog doesn't hide every row.
              setCategory("all");
              setTag("all");
              setPage(1);
            }}
            options={BLOG_OPTIONS}
            triggerClassName="w-32"
          />
          <FilterSelect
            label="Filter by category"
            value={category}
            onChange={(v) => {
              setCategory(v);
              setPage(1);
            }}
            options={categoryOptions}
          />
          {tagNames.length > 0 && (
            <FilterSelect
              label="Filter by tag"
              value={tag}
              onChange={(v) => {
                setTag(v);
                setPage(1);
              }}
              options={tagOptions}
              triggerClassName="w-36"
            />
          )}
          <FilterSelect
            label="Sort posts"
            value={sort}
            onChange={(v) => setSort(v as SortKey)}
            options={SORT_OPTIONS}
            triggerClassName="w-44"
          />
          <Input
            className="w-48"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search posts…"
            aria-label="Search posts"
          />
        </div>
      </div>

      {viewMode === "table" ? (
        <Table>
          <Table.ScrollContainer className="overflow-x-auto">
            <Table.Content aria-label="Posts" className="min-w-200">
              <Table.Header>
                <Table.Column isRowHeader>Post</Table.Column>
                <Table.Column className="hidden md:table-cell">
                  Blog
                </Table.Column>
                <Table.Column className="hidden lg:table-cell">
                  Category
                </Table.Column>
                <Table.Column>Status</Table.Column>
                <Table.Column className="hidden md:table-cell">
                  Updated
                </Table.Column>
                <Table.Column className="text-end">Actions</Table.Column>
              </Table.Header>
              <Table.Body
                items={items}
                renderEmptyState={() => (
                  <EmptyState className="flex h-40 w-full flex-col items-center justify-center gap-2 text-center">
                    <span className="text-sm font-medium text-foreground">
                      No posts found
                    </span>
                    <span className="text-xs text-muted">
                      Try a different filter or search.
                    </span>
                  </EmptyState>
                )}
              >
                {(row) => (
                  <Table.Row id={row.id}>
                    <Table.Cell>
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={row.imageUrl}
                          alt={`Cover image for ${row.title}`}
                          className="hidden h-10 w-14 shrink-0 rounded-lg bg-default object-cover sm:block"
                        />
                        <div className="min-w-0">
                          <Link
                            href={`/admin/posts/${row.id}/edit`}
                            className="block truncate font-semibold transition-colors hover:text-accent"
                          >
                            {row.title}
                            {row.featured && (
                              <StarFill
                                aria-label="Featured in carousel"
                                className="ml-1.5 inline size-3.5 align-text-top text-warning"
                              />
                            )}
                            {row.homeFeatured && (
                              <HouseFill
                                aria-label="Featured on home page"
                                className="ml-1.5 inline size-3.5 align-text-top text-warning"
                              />
                            )}
                          </Link>
                          <p className="truncate text-xs text-muted">
                            /{row.blog}/{row.slug}
                          </p>
                        </div>
                      </div>
                    </Table.Cell>

                    <Table.Cell className="hidden md:table-cell">
                      <Chip size="sm" variant="soft">
                        {row.blog}
                      </Chip>
                    </Table.Cell>

                    <Table.Cell className="hidden lg:table-cell">
                      <span className="text-sm text-muted">
                        {row.category?.name ?? "Uncategorised"}
                      </span>
                    </Table.Cell>

                    <Table.Cell>
                      <Chip
                        size="sm"
                        variant="soft"
                        color={
                          row.status === "PUBLISHED" ? "success" : "default"
                        }
                      >
                        {row.status === "PUBLISHED" ? "Published" : "Draft"}
                      </Chip>
                    </Table.Cell>

                    <Table.Cell className="hidden md:table-cell">
                      <span className="text-sm text-muted">
                        {row.updatedLabel}
                      </span>
                    </Table.Cell>

                    <Table.Cell className="text-end">
                      <div className="flex justify-end">
                        <RowActions
                          row={row}
                          onToggle={onToggleStatus}
                          onDelete={onDelete}
                        />
                      </div>
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>

          {paginationBlock && <Table.Footer>{paginationBlock}</Table.Footer>}
        </Table>
      ) : items.length === 0 ? (
        <EmptyState className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-lg border border-border bg-surface text-center">
          <span className="text-sm font-medium text-foreground">
            No posts found
          </span>
          <span className="text-xs text-muted">
            Try a different filter or search.
          </span>
        </EmptyState>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((row) => (
              <PostCard
                key={row.id}
                row={row}
                onToggle={onToggleStatus}
                onToggleFeatured={onToggleFeatured}
                onToggleHomeFeatured={onToggleHomeFeatured}
                onDelete={onDelete}
              />
            ))}
          </div>
          {paginationBlock && <div className="mt-6">{paginationBlock}</div>}
        </>
      )}
    </div>
  );
}
