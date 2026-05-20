"use client";

import { useState } from "react";
import { type Article } from "@/app/lib/articles";
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
}: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const isFiltered = query.trim() !== "" || category !== "All";

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
      <BlogLatestArticles
        articles={articles}
        basePath={basePath}
        query={query}
        category={category}
      />
    </>
  );
}
