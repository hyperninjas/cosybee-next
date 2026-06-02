"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { deletePost, setStatus } from "./actions";

/** Simple spinner for loading states. */
function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin h-4 w-4 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/** Fallback for invalid local image paths (seeded placeholder data). */
function getValidImageUrl(coverImage: string): string {
  if (!coverImage) return "/bee-flower.png";
  // External URLs (API media, https, etc.) are valid
  if (coverImage.startsWith("http://") || coverImage.startsWith("https://")) {
    return coverImage;
  }
  // Local paths starting with /images/ likely don't exist
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
  category: string;
  status: string;
  featured: boolean;
  coverImage: string;
  updatedAt: string; // ISO
};

const PAGE_SIZE = 8;

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

function StatusBadge({ status }: { status: string }) {
  const published = status === "PUBLISHED";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
        published ? "bg-[#E6F4EA] text-[#1E7B34]" : "bg-[#F2F2F2] text-[#777]"
      }`}
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}

function DeleteButton({ id, blog, slug }: { id: string; blog: string; slug: string }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-md border border-[#E5E5E5] bg-white px-3 py-1.5 text-sm font-medium text-[#666] transition-colors hover:border-[#F3C2BC] hover:bg-[#FFF8F7] hover:text-[#B4332A]"
      >
        Delete
      </button>
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
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="flex items-center gap-1.5 rounded-md bg-[#B4332A] px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#9c2c24] disabled:opacity-70"
      >
        {isPending ? (
          <>
            <Spinner className="text-white" />
            Deleting…
          </>
        ) : (
          "Confirm"
        )}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={isPending}
        className="rounded-md border border-[#DBDBDB] px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[#F2F2F2] disabled:opacity-50"
      >
        Cancel
      </button>
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
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-70 ${
        isPublished
          ? "border-[#E5E5E5] bg-white text-[#666] hover:border-[#DBDBDB] hover:bg-[#F9F9F9]"
          : "border-[#C6E7C9] bg-[#E8F5E9] text-[#1E7B34] hover:bg-[#DCF0DE]"
      }`}
    >
      {isPending ? (
        <>
          <Spinner />
          {isPublished ? "Unpublishing…" : "Publishing…"}
        </>
      ) : isPublished ? (
        "Unpublish"
      ) : (
        "Publish"
      )}
    </button>
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
  const [page, setPage] = useState(0);

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
      if (q && !`${r.title} ${r.slug} ${r.category}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [rows, tab, blog, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const shown = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  function reset<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(0);
    };
  }

  return (
    <div>
      {/* tabs + search */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-lg border border-[#E2E2E2] bg-white p-0.5 text-sm">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => reset(setTab)(t.key)}
              className={`rounded-md px-3 py-1.5 font-medium ${
                tab === t.key ? "bg-[#1b1b1b] text-white" : "text-[#545454]"
              }`}
            >
              {t.label}
              <span className="ml-1.5 text-xs opacity-70">{counts[t.key]}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={blog}
            onChange={(e) => reset(setBlog)(e.target.value as typeof blog)}
            className="rounded-lg border border-[#DBDBDB] bg-white px-2 py-1.5 text-sm"
          >
            <option value="all">All blogs</option>
            <option value="hive">Hive</option>
            <option value="learn">Learn</option>
          </select>
          <input
            value={query}
            onChange={(e) => reset(setQuery)(e.target.value)}
            placeholder="Search posts…"
            className="w-48 rounded-lg border border-[#DBDBDB] bg-white px-3 py-1.5 text-sm focus:border-[#FF8A7A] focus:outline-none"
          />
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#DBDBDB] px-4 py-12 text-center text-sm text-[#9A9A9A]">
          No posts match these filters.
        </p>
      ) : (
        <ul className="space-y-2">
          {shown.map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-4 rounded-xl border border-[#ECECEC] bg-white p-3"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getValidImageUrl(r.coverImage)}
                alt=""
                className="h-14 w-20 shrink-0 rounded-lg bg-[#F2F2F2] object-cover"
              />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/posts/${r.id}/edit`}
                  className="block truncate font-semibold hover:text-[#FF8A7A]"
                >
                  {r.title}
                  {r.featured && (
                    <span className="ml-2 align-middle text-xs font-medium text-[#C98A00]">
                      ★
                    </span>
                  )}
                </Link>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#9A9A9A]">
                  <span className="font-mono">/{r.blog}/{r.slug}</span>
                  <span>·</span>
                  <span>{r.category}</span>
                  <span>·</span>
                  <span>updated {relativeTime(r.updatedAt)}</span>
                </div>
              </div>
              <StatusBadge status={r.status} />
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={`/admin/posts/${r.id}/edit`}
                  className="rounded-md bg-[#1b1b1b] px-3.5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#333]"
                >
                  Edit
                </Link>
                <Link
                  href={`/admin/posts/${r.id}/preview`}
                  target="_blank"
                  className="rounded-md border border-[#E5E5E5] bg-white px-3 py-1.5 text-sm font-medium text-[#666] transition-colors hover:border-[#DBDBDB] hover:bg-[#F9F9F9]"
                >
                  Preview
                </Link>
                <StatusToggleButton
                  id={r.id}
                  blog={r.blog}
                  slug={r.slug}
                  status={r.status}
                />
                <DeleteButton id={r.id} blog={r.blog} slug={r.slug} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* pagination */}
      {pageCount > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3 text-sm">
          <button
            type="button"
            onClick={() => setPage(Math.max(0, safePage - 1))}
            disabled={safePage === 0}
            className="rounded-md border border-[#DBDBDB] px-3 py-1.5 font-medium disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-[#545454]">
            Page {safePage + 1} of {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))}
            disabled={safePage >= pageCount - 1}
            className="rounded-md border border-[#DBDBDB] px-3 py-1.5 font-medium disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
