"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { type Article } from "@/app/lib/article-types";
import Avatar from "../../ui/Avatar";
import Divider from "../../ui/Divider";
import Dot from "../../ui/Dot";

/** Check if URL is external (http/https) - these need unoptimized to bypass Next.js Image Optimization. */
function isExternalUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

const INITIAL_VISIBLE = 12;
const LOAD_STEP = 6;

export function ArticleCard({ a, basePath }: { a: Article; basePath: string }) {
  return (
    <>
      {/* Warm up the cross-origin media host (React 19 hoists + dedups this). */}
      <link rel="preconnect" href="https://eb-api.technext.it" />
      <Link
        href={`${basePath}/${a.slug}`}
      className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_8px_30px_-12px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)]"
    >
      <div className="relative aspect-[1.39]">
        <Image
          src={a.image}
          alt=""
          fill
          sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
          unoptimized={isExternalUrl(a.image)}
        />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap  justify-between items-center gap-2 text-[15px] font-medium text-[#545454]">
          <div className="flex flex-wrap items-center gap-2 text-[15px] max-h-8 font-medium text-[#545454]">
            {" "}
            <span>{a.readTime}</span>
            <Dot />
            <span>{a.author.date}</span>
          </div>

          <p className=" h-8 rounded-full border border-[#E6E6E6] bg-[#FAFAFA] px-3 py-1 font-semibold tracking-normal text-[#DE3B24] max-w-32.5 text-nowrap text-ellipsis overflow-hidden">
            {a.category}
          </p>
        </div>
        <h3 className="mt-3 text-xl font-bold leading-snug text-black">
          {a.title}
        </h3>
        <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-[#545454]">
          {a.description}
        </p>
        {a.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {a.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded-md bg-[#F3F3F3] px-2 py-0.5 text-xs font-medium text-[#666]"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
        <div className="mt-auto pt-4">
          <Divider />
          <div className="mt-4 flex items-center gap-5">
            <Avatar name={a.author.name} className="h-11 w-11" />
            <span className="text-[15px] font-bold text-black">
              {a.author.name}
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
    `${a.title} ${a.description} ${a.author.name} ${a.category} ${a.tags.join(" ")}`.toLowerCase();
  return haystack.includes(q);
}

type Props = {
  articles: Article[];
  basePath: string;
  query?: string;
  category?: string;
  tag?: string;
};

/**
 * "Latest Articles" — heading + 3-column responsive grid of article
 * cards. Starts with INITIAL_VISIBLE articles and reveals LOAD_STEP
 * more on each click of Load More. When the parent provides a query
 * or non-"All" category, the list is filtered and the heading reflects
 * the active filter.
 */
export default function BlogLatestArticles({
  articles,
  basePath,
  query = "",
  category = "All",
  tag = "",
}: Props) {
  const [visible, setVisible] = useState(INITIAL_VISIBLE);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter(
      (a) =>
        (category === "All" || a.category === category) &&
        (!tag || a.tags.includes(tag)) &&
        matchesArticle(a, q),
    );
  }, [articles, query, category, tag]);

  const shown = filtered.slice(0, visible);
  const canLoadMore = visible < filtered.length;

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
      <h2 className="text-2xl font-bold text-black sm:text-[32px]">
        {heading}
      </h2>
      {filtered.length === 0 ? (
        <p className="mt-8 text-base text-[#545454]">
          No articles match your search. Try a different keyword or category.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 lg:gap-8">
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
            className="rounded-[9px] bg-[#F2F4F7] px-8 py-3 text-lg font-bold text-[#1F1F1F] transition-colors hover:bg-neutral-200"
          >
            Load More
          </button>
        </div>
      )}
    </section>
  );
}
