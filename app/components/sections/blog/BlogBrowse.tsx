"use client";

import { useState } from "react";
import { type Article } from "@/app/lib/article-types";
import Divider from "../../ui/Divider";
import BlogFeatured from "./BlogFeatured";
import BlogFilterBar from "./BlogFilterBar";
import BlogLatestArticles from "./BlogLatestArticles";

type Props = {
  articles: Article[];
  featured: Article[];
  categories: readonly string[];
  /** Link base for article cards/links, e.g. "/hive" or "/learn". */
  basePath: string;
  /** Active tag from the URL (?tag=…) to pre-filter by. */
  initialTag?: string;
};

/**
 * Client wrapper that owns the blog filter state (search query +
 * active category) and shares it with the filter bar and the latest
 * articles grid. The featured carousel collapses with a CSS
 * `grid-rows` transition when any filter is active so users land
 * straight on results.
 */
export default function BlogBrowse({
  articles,
  featured,
  categories,
  basePath,
  initialTag,
}: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [tag, setTag] = useState(initialTag ?? "");
  const isFiltered = query.trim() !== "" || category !== "All" || tag !== "";

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
      <div
        aria-hidden={isFiltered}
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
      {tag && (
        <div className="mx-auto max-w-360 px-6 pt-8 sm:px-10 lg:px-30">
          <button
            type="button"
            onClick={() => setTag("")}
            className="inline-flex items-center gap-2 rounded-full bg-[#EBF2F5] px-3 py-1.5 text-sm font-semibold text-[#1b4a5e] hover:bg-[#dce8ed]"
          >
            Filtering by #{tag}
            <span aria-hidden className="text-[#1b4a5e]/60">✕</span>
          </button>
        </div>
      )}
      <BlogLatestArticles
        articles={articles}
        basePath={basePath}
        query={query}
        category={category}
        tag={tag}
      />
    </>
  );
}
