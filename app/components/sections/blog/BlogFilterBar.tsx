"use client";

import { Button, SearchField } from "@heroui/react";
import type { CategorySummary } from "@/app/lib/article-types";

type Props = {
  categories: readonly CategorySummary[];
  query: string;
  onQueryChange: (q: string) => void;
  /** Active category *slug*; "" means All. */
  category: string;
  onCategoryChange: (slug: string) => void;
};

/**
 * Controlled search input + horizontal category chip row. Filter state lives in
 * the parent (see BlogBrowse) so the featured carousel and latest grid can
 * react to it, and the chips filter the grid in place rather than navigating.
 *
 * These chips are deliberately NOT the crawl path to the category pages — they
 * are buttons, invisible to a crawler. Discovery runs through the "Browse by
 * category" link list the hub renders below the grid (CategoryChips), and the
 * sitemap. Keep that list in place: without it the category pages are orphans.
 *
 * Chips carry the category *slug*, not its name, so the mirrored `?category=`
 * URL matches the canonical `/[blog]/category/[slug]` page it points at.
 */
export default function BlogFilterBar({
  categories,
  query,
  onQueryChange,
  category,
  onCategoryChange,
}: Props) {
  return (
    <div className="mx-auto max-w-360 px-6 py-6 sm:px-10 lg:px-30">
      <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-center lg:justify-between overflow-visible">
        {/* search */}
        <SearchField
          aria-label="Search articles"
          value={query}
          onChange={onQueryChange}
          className="w-full max-w-90.5 px-1 -mx-1"
        >
          <SearchField.Group className="rounded-full">
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Search articles..." />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>

        {/* category filters */}
        <div className="flex flex-nowrap overflow-auto items-center gap-2 p-1 -mx-1">
          <Button
            variant={category === "" ? "primary" : "tertiary"}
            onPress={() => onCategoryChange("")}
            className="shrink-0 rounded-full whitespace-nowrap"
          >
            All
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.slug}
              variant={category === cat.slug ? "primary" : "tertiary"}
              onPress={() => onCategoryChange(cat.slug)}
              className="shrink-0 rounded-full whitespace-nowrap"
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
