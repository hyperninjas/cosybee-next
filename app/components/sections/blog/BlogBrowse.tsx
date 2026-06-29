"use client";

import { useEffect, useState } from "react";
import { type Article } from "@/app/lib/article-types";
import Divider from "@/app/components/ui/Divider";
import BlogFeatured from "./BlogFeatured";
import BlogFilterBar from "./BlogFilterBar";
import BlogLatestArticles from "./BlogLatestArticles";

type Props = {
  articles: Article[];
  featured: Article[];
  categories: readonly string[];
  /** Link base for article cards/links, e.g. "/hive" or "/learn". */
  basePath: string;
  /** Initial search query from the URL (?q=…). */
  initialQuery?: string;
  /** Initial category from the URL (?category=…). */
  initialCategory?: string;
  /** Initial tag from the URL (?tag=…). */
  initialTag?: string;
  /** Current browse page (from ?page=…). Only relevant when no filter is set. */
  page?: number;
};

/**
 * Client wrapper that owns the blog filter state (search query, active
 * category, active tag) and shares it with the filter bar and the latest
 * articles grid. The featured carousel collapses with a CSS `grid-rows`
 * transition when any filter is active so users land straight on results.
 *
 * All filter state is mirrored into the URL (?q / ?category / ?tag) via the
 * History API so a shared/bookmarked link reproduces the exact filtered view.
 * State is seeded from the server-parsed URL params for a correct first paint.
 */
export default function BlogBrowse({
  articles,
  featured,
  categories,
  basePath,
  initialQuery = "",
  initialCategory = "All",
  initialTag = "",
  page: initialPage = 1,
}: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [tag, setTag] = useState(initialTag);
  // Browse page is client state (seeded from the server-parsed ?page=). Paging
  // re-slices the already-loaded set instantly; the effect below mirrors it
  // into the URL via replaceState, so there's no server round-trip / re-render.
  const [page, setPage] = useState(initialPage);
  const isFiltered = query.trim() !== "" || category !== "All" || tag !== "";

  // Mirror state into the URL so the view is shareable. replaceState keeps it
  // instant (no server round-trip / no history spam). When filtering we encode
  // ?q/?category/?tag; when just browsing we keep ?page (set by the crawlable
  // pagination links). Empty/default values are omitted for clean URLs.
  useEffect(() => {
    const params = new URLSearchParams();
    if (isFiltered) {
      const q = query.trim();
      if (q) params.set("q", q);
      if (category !== "All") params.set("category", category);
      if (tag) params.set("tag", tag);
    } else if (page > 1) {
      params.set("page", String(page));
    }
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `${basePath}?${qs}` : basePath);
  }, [query, category, tag, page, basePath, isFiltered]);

  return (
    <>
      <BlogFilterBar
        categories={categories}
        query={query}
        onQueryChange={setQuery}
        category={category}
        onCategoryChange={setCategory}
      />
      <Divider />
      {featured.length > 0 && page === 1 && (
        <div
          // `inert` (not just aria-hidden) so the collapsed carousel's links
          // and controls drop out of the tab order too — otherwise Tab lands
          // on the hidden featured slides before the filtered results. Doesn't
          // affect the CSS transition below.
          inert={isFiltered}
          className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out ${
            isFiltered
              ? "grid-rows-[0fr] opacity-0"
              : "grid-rows-[1fr] opacity-100"
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <BlogFeatured slides={featured} basePath={basePath} />
          </div>
        </div>
      )}
      {tag && (
        <div className="mx-auto max-w-360 px-6 pt-8 sm:px-10 lg:px-30">
          <button
            type="button"
            onClick={() => setTag("")}
            className="inline-flex items-center gap-2 rounded-full bg-surface-secondary px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-[#dce8ed]"
          >
            Filtering by #{tag}
            <span aria-hidden className="text-foreground/60">
              ✕
            </span>
          </button>
        </div>
      )}
      <BlogLatestArticles
        articles={articles}
        basePath={basePath}
        query={query}
        category={category}
        tag={tag}
        page={page}
        onPageChange={setPage}
        // The carousel only occupies space (and warrants tucking the grid up
        // under it) when there are featured posts, we're on page 1, and no
        // filter is collapsing it.
        showFeatured={featured.length > 0 && page === 1 && !isFiltered}
      />
    </>
  );
}
