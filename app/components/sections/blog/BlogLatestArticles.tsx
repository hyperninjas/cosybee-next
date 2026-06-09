"use client";

import { AppImage as Image } from "@/app/components/ui/AppImage";
import { AppLink as Link } from "@/app/components/ui/AppLink";
import { useMemo, useState } from "react";
import {
  type Article,
  formatReadTime,
  ARTICLES_PER_PAGE,
} from "@/app/lib/article-types";
import Avatar from "@/app/components/ui/Avatar";
import Divider from "@/app/components/ui/Divider";
import Dot from "@/app/components/ui/Dot";
import Pagination from "@/app/components/ui/Pagination";

/** Format ISO date string to display format. */
function formatDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return isoDate;
  }
}

/** Check if URL is external (http/https) - these need unoptimized to bypass Next.js Image Optimization. */
function isExternalUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

const LOAD_STEP = 6;

export function ArticleCard({ a, basePath }: { a: Article; basePath: string }) {
  return (
    <>
      {/* Warm up the cross-origin media host (React 19 hoists + dedups this). */}
      <link rel="preconnect" href="https://eb-api.technext.it" />
      <Link
        href={`${basePath}/${a.slug}`}
      className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-[0px_1px_3px_0px_rgba(0,0,0,0.08)]"
    >
      <div className="relative h-48">
        <Image
          src={a.coverImage}
          alt={a.coverImageAlt}
          fill
          sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
          className="object-cover hover:scale-105 transition-transform duration-300"
          unoptimized={isExternalUrl(a.coverImage)}
        />
        <span className="absolute left-4 top-4 rounded-full bg-background px-3 py-1 text-xs font-semibold text-accent">
          {a.category?.name ?? "Uncategorised"}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <span>{formatReadTime(a.readTime)}</span>
          <Dot />
          <span>{formatDate(a.authorDate)}</span>
        </div>
        <h3 className="mt-3 line-clamp-2 text-lg font-bold leading-snug text-foreground">
          {a.title}
        </h3>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">
          {a.description}
        </p>
        {a.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {a.tags.slice(0, 3).map((t) => (
              <span
                key={t.id}
                className="rounded-md bg-background px-2 py-0.5 text-xs font-medium text-muted"
              >
                #{t.name}
              </span>
            ))}
          </div>
        )}
        <div className="mt-auto pt-4">
          <Divider />
          <div className="mt-4 flex items-center gap-3">
            <Avatar name={a.author?.name ?? "energiebee"} avatarUrl={a.author?.avatarUrl} className="h-10 w-10" />
            <span className="text-sm font-semibold text-foreground">
              {a.author?.name ?? "energiebee"}
            </span>
          </div>
        </div>
      </div>
      </Link>
    </>
  );
}

function matchesArticle(a: Article, q: string) {
  if (!q) return true;
  const haystack =
    `${a.title} ${a.description} ${a.author?.name ?? ""} ${a.category?.name ?? ""} ${a.tags.map((t) => t.name).join(" ")}`.toLowerCase();
  return haystack.includes(q);
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
  const totalPages = Math.max(1, Math.ceil(filtered.length / ARTICLES_PER_PAGE));
  const shown = isFiltered
    ? filtered.slice(0, visible)
    : filtered.slice((page - 1) * ARTICLES_PER_PAGE, page * ARTICLES_PER_PAGE);
  const canLoadMore = isFiltered && visible < filtered.length;

  const q = query.trim();
  const heading = q
    ? `Results for "${q}"`
    : tag
      ? `#${tag}`
      : category !== "All"
        ? category
        : "Latest Articles";

  return (
    <section
      className={`mx-auto max-w-360 px-6 py-12 pt-0 sm:px-10 lg:px-30 lg:py-12 ${heading === "Latest Articles" ? "lg:pt-0" : ""} `}
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
          <button
            type="button"
            onClick={() =>
              setVisible((v) => Math.min(v + LOAD_STEP, filtered.length))
            }
            className="rounded-[9px] bg-[#F2F4F7] px-8 py-3 text-lg font-bold text-foreground transition-colors hover:bg-surface-secondary"
          >
            Load More
          </button>
        </div>
      )}
      {!isFiltered && (
        <div className="mt-12">
          <Pagination basePath={basePath} page={page} totalPages={totalPages} />
        </div>
      )}
    </section>
  );
}
