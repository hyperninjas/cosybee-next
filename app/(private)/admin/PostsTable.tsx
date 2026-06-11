"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EllipsisVertical } from "@gravity-ui/icons";
import {
  buttonVariants,
  Button,
  Chip,
  Dropdown,
  EmptyState,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Modal,
  Pagination,
  Select,
  Separator,
  Table,
  Tabs,
} from "@heroui/react";
import { deletePost, setStatus } from "./actions";
import type { Category } from "@/app/lib/article-types";

/** Fallback for invalid local image paths (seeded placeholder data). */
function getValidImageUrl(coverImage: string): string {
  if (!coverImage) return "/bee-flower.png";
  if (coverImage.startsWith("http://") || coverImage.startsWith("https://")) {
    return coverImage;
  }
  if (coverImage.startsWith("/images/")) {
    return "/bee-flower.png";
  }
  return coverImage;
}

export type Row = {
  id: string;
  blog: string;
  slug: string;
  title: string;
  category: Category;
  status: string;
  featured: boolean;
  coverImage: string;
  updatedAt: string;
};

const PAGE_SIZE = 10;

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
  | { type: "delete"; id: string };

const TABS = [
  { key: "ALL", label: "All" },
  { key: "PUBLISHED", label: "Published" },
  { key: "DRAFT", label: "Drafts" },
] as const;

/**
 * Row actions as a single three-dot menu (keeps the column compact and
 * consistent). Edit/Preview navigate; Publish toggles optimistically; Delete
 * opens a confirm modal so the destructive action is intentional.
 */
function RowActions({
  row,
  onToggle,
  onDelete,
}: {
  row: Row;
  onToggle: (row: Row) => void;
  onDelete: (row: Row) => void;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isPublished = row.status === "PUBLISHED";

  function onAction(key: string) {
    switch (key) {
      case "edit":
        router.push(`/admin/posts/${row.id}/edit`);
        break;
      case "preview":
        window.open(
          `/admin/posts/${row.id}/preview`,
          "_blank",
          "noopener,noreferrer",
        );
        break;
      case "toggle":
        onToggle(row);
        break;
      case "delete":
        setConfirmOpen(true);
        break;
    }
  }

  return (
    <>
      <Dropdown>
        <Dropdown.Trigger
          aria-label="Post actions"
          // Dropdown.Trigger IS the <button> (a nested <Button> would be
          // button-in-button). Its `.dropdown__trigger` class is `inline-block`,
          // which overrides the button's flex centering — so re-assert
          // inline-flex centering via utilities (utilities beat the component layer).
          className={`${buttonVariants({
            variant: "ghost",
            size: "sm",
            isIconOnly: true,
          })} inline-flex items-center justify-center`}
        >
          <EllipsisVertical className="size-4" />
        </Dropdown.Trigger>
        <Dropdown.Popover className="min-w-40">
          <Dropdown.Menu onAction={(key) => onAction(String(key))}>
            <Dropdown.Item id="edit" textValue="Edit">
              <Label>Edit</Label>
            </Dropdown.Item>
            <Dropdown.Item id="preview" textValue="Preview">
              <Label>Preview</Label>
            </Dropdown.Item>
            <Dropdown.Item
              id="toggle"
              textValue={isPublished ? "Unpublish" : "Publish"}
            >
              <Label>{isPublished ? "Unpublish" : "Publish"}</Label>
            </Dropdown.Item>
            <Separator />
            <Dropdown.Item id="delete" textValue="Delete" variant="danger">
              <Label>Delete</Label>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>

      <Modal.Backdrop
        variant="blur"
        isOpen={confirmOpen}
        onOpenChange={setConfirmOpen}
      >
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Delete this post?</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p className="text-sm text-muted">
                <span className="font-medium text-foreground">{row.title}</span>{" "}
                (/{row.blog}/{row.slug}) will be permanently deleted. This
                can&apos;t be undone.
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="tertiary">
                Cancel
              </Button>
              <Button
                variant="danger"
                onPress={() => {
                  onDelete(row);
                  setConfirmOpen(false);
                }}
              >
                Delete post
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}

export default function PostsTable({ rows }: { rows: Row[] }) {
  // Optimistic mirror of the server data: status flips and deletes apply
  // instantly, then reconcile when the server action revalidates `rows`.
  const [optimisticRows, applyOptimistic] = useOptimistic(
    rows,
    (state, action: OptimisticAction) =>
      action.type === "delete"
        ? state.filter((r) => r.id !== action.id)
        : state.map((r) =>
            r.id === action.id ? { ...r, status: action.status } : r,
          ),
  );
  const [, startTransition] = useTransition();

  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("ALL");
  const [blog, setBlog] = useState<"all" | "hive" | "learn">("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const counts = useMemo(
    () => ({
      ALL: optimisticRows.length,
      PUBLISHED: optimisticRows.filter((r) => r.status === "PUBLISHED").length,
      DRAFT: optimisticRows.filter((r) => r.status === "DRAFT").length,
    }),
    [optimisticRows],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return optimisticRows.filter((r) => {
      if (tab !== "ALL" && r.status !== tab) return false;
      if (blog !== "all" && r.blog !== blog) return false;
      if (
        q &&
        !`${r.title} ${r.slug} ${r.category?.name ?? ""}`
          .toLowerCase()
          .includes(q)
      )
        return false;
      return true;
    });
  }, [optimisticRows, tab, blog, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const shown = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  // Precompute display fields during render (NOT inside the Table render prop,
  // which runs outside render and would trip the React Compiler on the helpers).
  const items = shown.map((r) => ({
    ...r,
    imageUrl: getValidImageUrl(r.coverImage),
    updatedLabel: relativeTime(r.updatedAt),
  }));

  const showNumbered = pageCount > 1 && pageCount <= 7;
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, filtered.length);

  function onToggleStatus(row: Row) {
    const next = row.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    const fd = new FormData();
    fd.append("id", row.id);
    fd.append("blog", row.blog);
    fd.append("slug", row.slug);
    fd.append("status", next);
    startTransition(async () => {
      applyOptimistic({ type: "status", id: row.id, status: next });
      await setStatus(fd);
    });
  }

  function onDelete(row: Row) {
    const fd = new FormData();
    fd.append("id", row.id);
    fd.append("blog", row.blog);
    fd.append("slug", row.slug);
    startTransition(async () => {
      applyOptimistic({ type: "delete", id: row.id });
      await deletePost(fd);
    });
  }

  return (
    <div>
      {/* Filters: Tabs + Blog Select + Search (on the page background → the
          default primary input variant is correct here). */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
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

        <div className="flex items-center gap-3">
          <Select
            aria-label="Filter by blog"
            selectedKey={blog}
            onSelectionChange={(k) => {
              setBlog(String(k) as typeof blog);
              setPage(1);
            }}
          >
            <Select.Trigger className="w-32">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBoxItem textValue="All blogs" id="all">
                  All blogs
                </ListBoxItem>
                <ListBoxItem textValue="Hive" id="hive">
                  Hive
                </ListBoxItem>
                <ListBoxItem textValue="Learn" id="learn">
                  Learn
                </ListBoxItem>
              </ListBox>
            </Select.Popover>
          </Select>
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

      <Table>
        <Table.ScrollContainer className="overflow-x-auto">
          <Table.Content aria-label="Posts" className="min-w-200">
            <Table.Header>
              <Table.Column isRowHeader>Post</Table.Column>
              <Table.Column className="hidden md:table-cell">Blog</Table.Column>
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
                  {/* Post (Image + Title + Slug) */}
                  <Table.Cell>
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={row.imageUrl}
                        alt=""
                        className="hidden h-10 w-14 shrink-0 rounded-lg bg-default object-cover sm:block"
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/admin/posts/${row.id}/edit`}
                          className="block truncate font-semibold transition-colors hover:text-accent"
                        >
                          {row.title}
                          {row.featured && (
                            <span className="ml-1.5 text-warning">★</span>
                          )}
                        </Link>
                        <p className="truncate text-xs text-muted">
                          /{row.blog}/{row.slug}
                        </p>
                      </div>
                    </div>
                  </Table.Cell>

                  {/* Blog */}
                  <Table.Cell className="hidden md:table-cell">
                    <Chip size="sm" variant="soft">
                      {row.blog}
                    </Chip>
                  </Table.Cell>

                  {/* Category */}
                  <Table.Cell className="hidden lg:table-cell">
                    <span className="text-sm text-muted">
                      {row.category?.name ?? "Uncategorised"}
                    </span>
                  </Table.Cell>

                  {/* Status */}
                  <Table.Cell>
                    <Chip
                      size="sm"
                      variant="soft"
                      color={row.status === "PUBLISHED" ? "success" : "default"}
                    >
                      {row.status === "PUBLISHED" ? "Published" : "Draft"}
                    </Chip>
                  </Table.Cell>

                  {/* Updated */}
                  <Table.Cell className="hidden md:table-cell">
                    <span className="text-sm text-muted">
                      {row.updatedLabel}
                    </span>
                  </Table.Cell>

                  {/* Actions */}
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

        {filtered.length > 0 && (
          <Table.Footer>
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
                  Array.from({ length: pageCount }, (_, i) => i + 1).map(
                    (p) => (
                      <Pagination.Item key={p} className="hidden sm:flex">
                        <Pagination.Link
                          isActive={p === safePage}
                          onPress={() => setPage(p)}
                        >
                          {p}
                        </Pagination.Link>
                      </Pagination.Item>
                    ),
                  )}

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
          </Table.Footer>
        )}
      </Table>
    </div>
  );
}
