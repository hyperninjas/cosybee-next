"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { deletePost, setStatus } from "./actions";

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

function DeleteButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-md border border-[#F3C2BC] px-3 py-1.5 text-sm font-medium text-[#B4332A] hover:bg-[#FDECEC]"
      >
        Delete
      </button>
    );
  }
  return (
    <form action={deletePost} className="flex items-center gap-1">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded-md bg-[#B4332A] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#9c2c24]"
      >
        Confirm
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="rounded-md border border-[#DBDBDB] px-3 py-1.5 text-sm font-medium hover:bg-[#F2F2F2]"
      >
        Cancel
      </button>
    </form>
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
                src={r.coverImage}
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
                  className="rounded-md border border-[#DBE6EB] px-3 py-1.5 text-sm font-medium hover:bg-[#F2F7F9]"
                >
                  Edit
                </Link>
                <Link
                  href={`/admin/posts/${r.id}/preview`}
                  target="_blank"
                  className="rounded-md border border-[#DBE6EB] px-3 py-1.5 text-sm font-medium hover:bg-[#F2F7F9]"
                >
                  Preview
                </Link>
                <form action={setStatus}>
                  <input type="hidden" name="id" value={r.id} />
                  <input
                    type="hidden"
                    name="status"
                    value={r.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"}
                  />
                  <button
                    type="submit"
                    className="rounded-md border border-[#DBE6EB] px-3 py-1.5 text-sm font-medium hover:bg-[#F2F7F9]"
                  >
                    {r.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                  </button>
                </form>
                <DeleteButton id={r.id} />
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
