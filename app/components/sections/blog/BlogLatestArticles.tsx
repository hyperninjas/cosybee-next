"use client";

import { useMemo, useState } from "react";
import { type Article, ARTICLES_PER_PAGE } from "@/app/lib/article-types";
import { Section } from "@/app/components/ui/Section";
import Pagination from "@/app/components/ui/Pagination";
import { Button } from "@heroui/react";
import { ArticleCard } from "./ArticleCard";

const LOAD_STEP = 6;

function matchesArticle(a: Article, q: string) {
  if (!q) return true;
  const haystack =
    `${a.title} ${a.description} ${a.author?.name ?? ""} ${a.category?.name ?? ""} ${a.tags.map((t) => t.name).join(" ")}`.toLowerCase();
  return haystack.includes(q);
}

/** Derive the section heading from the active filter, if any. */
function deriveHeading(query: string, category: string, tag: string): string {
  const q = query.trim();
  if (q) return `Results for "${q}"`;
  if (tag) return `#${tag}`;
  if (category !== "All") return category;
  return "Latest Articles";
}

type Props = {
  /** The full article set; filtering/pagination happens here on the client. */
  articles: Article[];
  basePath: string;
  query?: string;
  category?: string;
  tag?: string;
  /** Current browse page (1-based). Only used when no filter is active. */
  page?: number;
};

/**
 * "Latest Articles" — heading + 3-column responsive grid of article cards.
 *
 * Two mutually-exclusive modes:
 * - **Browse** (no query/category/tag): shows page `page` of all articles with
 *   crawlable numbered <Pagination> (real ?page=N links → every article is
 *   reachable by search engines).
 * - **Filter/search**: filters the full set client-side and reveals results
 *   with Load More. This view is shareable (URL synced by the parent) but
 *   noindex, so pagination crawlability doesn't matter here.
 */
export default function BlogLatestArticles({
  articles,
  basePath,
  query = "",
  category = "All",
  tag = "",
  page = 1,
}: Props) {
  const isFiltered = query.trim() !== "" || category !== "All" || tag !== "";
  const [visible, setVisible] = useState(ARTICLES_PER_PAGE);

  // Reset the Load-More reveal whenever the active filter changes — React's
  // "adjust state during render" pattern (no effect, no extra render pass).
  const filterKey = `${query}|${category}|${tag}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    setVisible(ARTICLES_PER_PAGE);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter(
      (a) =>
        (category === "All" || a.category?.name === category) &&
        (!tag || a.tags.some((t) => t.name === tag)) &&
        matchesArticle(a, q),
    );
  }, [articles, query, category, tag]);

  // Browse mode → slice to the current page; filter mode → Load-More reveal.
  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / ARTICLES_PER_PAGE),
  );
  const shown = isFiltered
    ? filtered.slice(0, visible)
    : filtered.slice((page - 1) * ARTICLES_PER_PAGE, page * ARTICLES_PER_PAGE);
  const canLoadMore = isFiltered && visible < filtered.length;

  const heading = deriveHeading(query, category, tag);

  return (
    <Section
      spacing="none"
      className={`mx-auto max-w-360 px-6 py-6 sm:px-10 lg:px-30 lg:py-8 ${heading === "Latest Articles" ? "pt-0 lg:pt-0" : ""} `}
    >
      <h2 className="text-2xl font-bold text-foreground sm:text-[32px]">
        {heading}
      </h2>
      {filtered.length === 0 ? (
        <p className="mt-8 text-base text-muted">
          No articles match your search. Try a different keyword or category.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 lg:gap-6">
          {shown.map((a) => (
            <ArticleCard key={a.slug} a={a} basePath={basePath} />
          ))}
        </div>
      )}
      {canLoadMore && (
        <div className="mt-10 flex justify-center">
          <Button
            variant="tertiary"
            onPress={() =>
              setVisible((v) => Math.min(v + LOAD_STEP, filtered.length))
            }
            className="rounded-[9px] bg-surface-secondary px-8 py-3 text-lg font-bold text-foreground transition-colors hover:bg-surface-tertiary"
          >
            Load More
          </Button>
        </div>
      )}
      {!isFiltered && (
        <div className="mt-12">
          <Pagination basePath={basePath} page={page} totalPages={totalPages} />
        </div>
      )}
    </Section>
  );
}
