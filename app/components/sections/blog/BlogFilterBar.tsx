"use client";

import { Button, SearchField } from "@heroui/react";

type Props = {
  categories: readonly string[];
  query: string;
  onQueryChange: (q: string) => void;
  category: string;
  onCategoryChange: (cat: string) => void;
};

/**
 * Controlled search input + horizontal category chip row. Filter
 * state lives in the parent (see BlogBrowse) so the featured carousel
 * and latest grid can react to it. Categories are passed in so each
 * blog (hive, learn, …) can define its own.
 */
export default function BlogFilterBar({
  categories,
  query,
  onQueryChange,
  category,
  onCategoryChange,
}: Props) {
  return (
    <div className="mx-auto max-w-360 px-6 py-12 sm:px-10 lg:px-30">
      <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* search */}
        <SearchField
          aria-label="Search articles"
          value={query}
          onChange={onQueryChange}
          className="w-full max-w-90.5"
        >
          <SearchField.Group className="rounded-full">
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Search articles..." />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>

        {/* category filters */}
        <div className="flex flex-nowrap overflow-auto items-center gap-2">
          {categories.map((cat, i) => (
            <Button
              key={cat + i}
              variant={category === cat ? "primary" : "tertiary"}
              onPress={() => onCategoryChange(cat)}
              className="shrink-0 rounded-full whitespace-nowrap"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
