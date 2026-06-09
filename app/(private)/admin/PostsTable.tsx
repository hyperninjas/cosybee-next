"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  Button,
  buttonVariants,
  Chip,
  Input,
  ListBox,
  ListBoxItem,
  Pagination,
  Select,
  Spinner,
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

function DeleteButton({ id, blog, slug }: { id: string; blog: string; slug: string }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <Button variant="outline" size="sm" onPress={() => setConfirming(true)}>
        Delete
      </Button>
    );
  }

  const handleDelete = () => {
    const formData = new FormData();
    formData.append("id", id);
    formData.append("blog", blog);
    formData.append("slug", slug);
    startTransition(() => {
      deletePost(formData);
    });
  };

  return (
    <div className="flex items-center gap-1.5">
      <Button variant="danger" size="sm" onPress={handleDelete} isDisabled={isPending}>
        {isPending ? <Spinner size="sm" /> : "Confirm"}
      </Button>
      <Button variant="ghost" size="sm" onPress={() => setConfirming(false)} isDisabled={isPending}>
        Cancel
      </Button>
    </div>
  );
}

function StatusToggleButton({
  id,
  blog,
  slug,
  status,
}: {
  id: string;
  blog: string;
  slug: string;
  status: string;
}) {
  const [isPending, startTransition] = useTransition();
  const isPublished = status === "PUBLISHED";

  const handleToggle = () => {
    const formData = new FormData();
    formData.append("id", id);
    formData.append("blog", blog);
    formData.append("slug", slug);
    formData.append("status", isPublished ? "DRAFT" : "PUBLISHED");
    startTransition(() => {
      setStatus(formData);
    });
  };

  return (
    <Button
      variant={isPublished ? "outline" : "primary"}
      size="sm"
      onPress={handleToggle}
      isDisabled={isPending}
      className="min-w-[90px]"
    >
      {isPending ? <Spinner size="sm" /> : isPublished ? "Unpublish" : "Publish"}
    </Button>
  );
}

const TABS = [
  { key: "ALL", label: "All" },
  { key: "PUBLISHED", label: "Published" },
  { key: "DRAFT", label: "Drafts" },
] as const;

export default function PostsTable({ rows }: { rows: Row[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("ALL");
  const [blog, setBlog] = useState<"all" | "hive" | "learn">("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const counts = useMemo(
    () => ({
      ALL: rows.length,
      PUBLISHED: rows.filter((r) => r.status === "PUBLISHED").length,
      DRAFT: rows.filter((r) => r.status === "DRAFT").length,
    }),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (tab !== "ALL" && r.status !== tab) return false;
      if (blog !== "all" && r.blog !== blog) return false;
      if (q && !`${r.title} ${r.slug} ${r.category?.name ?? ""}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [rows, tab, blog, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const shown = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div>
      {/* Filters: Tabs + Blog Select + Search */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Tabs
          selectedKey={tab}
          onSelectionChange={(k) => {
            setTab(k as (typeof TABS)[number]["key"]);
            setPage(1);
          }}
        >
          <Tabs.List>
            {TABS.map((t) => (
              <Tabs.Tab key={t.key} id={t.key}>
                {t.label}
                <span className="ml-1.5 text-xs opacity-70">{counts[t.key]}</span>
              </Tabs.Tab>
            ))}
          </Tabs.List>
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
                <ListBoxItem id="all">All blogs</ListBoxItem>
                <ListBoxItem id="hive">Hive</ListBoxItem>
                <ListBoxItem id="learn">Learn</ListBoxItem>
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

      {/* Table */}
      {shown.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#DBDBDB] py-16 text-center text-sm text-[#9A9A9A]">
          No posts match these filters.
        </div>
      ) : (
        <Table>
          <Table.ScrollContainer className="overflow-x-auto">
            <Table.Content aria-label="Posts">
              <Table.Header>
                <Table.Column isRowHeader>Post</Table.Column>
                <Table.Column className="hidden md:table-cell">Blog</Table.Column>
                <Table.Column className="hidden lg:table-cell">Category</Table.Column>
                <Table.Column>Status</Table.Column>
                <Table.Column className="hidden md:table-cell">Updated</Table.Column>
                <Table.Column>Actions</Table.Column>
              </Table.Header>
              <Table.Body items={shown}>
                {(row) => {
                  const imageUrl = getValidImageUrl(row.coverImage);
                  const updatedTime = relativeTime(row.updatedAt);
                  return (
                    <Table.Row id={row.id}>
                      {/* Post (Title + Image + Slug) */}
                      <Table.Cell>
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imageUrl}
                            alt=""
                            className="hidden h-10 w-14 shrink-0 rounded-lg bg-[#F2F2F2] object-cover sm:block"
                          />
                          <div className="min-w-0">
                            <Link
                              href={`/admin/posts/${row.id}/edit`}
                              className="block truncate font-semibold hover:text-[#FF8A7A]"
                            >
                              {row.title}
                              {row.featured && (
                                <span className="ml-1.5 text-[#C98A00]">★</span>
                              )}
                            </Link>
                            <p className="truncate text-xs text-[#9A9A9A]">
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
                        <span className="text-sm text-[#545454]">
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
                        <span className="text-sm text-[#9A9A9A]">
                          {updatedTime}
                        </span>
                      </Table.Cell>

                      {/* Actions */}
                      <Table.Cell>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/posts/${row.id}/edit`}
                            className={buttonVariants({ variant: "secondary", size: "sm" })}
                          >
                            Edit
                          </Link>
                          <Link
                            href={`/admin/posts/${row.id}/preview`}
                            target="_blank"
                            className={`hidden sm:inline-flex ${buttonVariants({ variant: "outline", size: "sm" })}`}
                          >
                            Preview
                          </Link>
                          <StatusToggleButton
                            id={row.id}
                            blog={row.blog}
                            slug={row.slug}
                            status={row.status}
                          />
                          <DeleteButton id={row.id} blog={row.blog} slug={row.slug} />
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  );
                }}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      )}

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <span className="text-sm text-[#545454]">
          Showing {shown.length} of {filtered.length} posts
        </span>
        {pageCount > 1 && (
          <Pagination>
            <Pagination.Content>
              <Pagination.Previous
                isDisabled={safePage <= 1}
                onPress={() => setPage(Math.max(1, safePage - 1))}
              >
                Previous
              </Pagination.Previous>
              <Pagination.Item>
                <span className="px-3 text-sm text-[#545454]">
                  Page {safePage} of {pageCount}
                </span>
              </Pagination.Item>
              <Pagination.Next
                isDisabled={safePage >= pageCount}
                onPress={() => setPage(Math.min(pageCount, safePage + 1))}
              >
                Next
              </Pagination.Next>
            </Pagination.Content>
          </Pagination>
        )}
      </div>
    </div>
  );
}
