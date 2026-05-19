"use client";

import { useState } from "react";
import Divider from "../../ui/Divider";
import HiveFeatured from "./HiveFeatured";
import HiveFilterBar, { type HiveCategory } from "./HiveFilterBar";
import HiveLatestArticles from "./HiveLatestArticles";

/**
 * Client wrapper that owns the hive filter state (search query +
 * active category) and shares it with the filter bar and the latest
 * articles grid. The featured carousel collapses with a CSS
 * `grid-rows` transition when any filter is active so users land
 * straight on results.
 */
export default function HiveBrowse() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<HiveCategory>("All");
  const isFiltered = query.trim() !== "" || category !== "All";

  return (
    <>
      <HiveFilterBar
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
          <HiveFeatured />
        </div>
      </div>
      <HiveLatestArticles query={query} category={category} />
    </>
  );
}
