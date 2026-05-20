"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { getLatestArticles, type HiveArticle } from "@/app/lib/hive-articles";
import Avatar from "../../ui/Avatar";
import Divider from "../../ui/Divider";
import Dot from "../../ui/Dot";
import type { HiveCategory } from "./HiveFilterBar";

const INITIAL_VISIBLE = 3;
const LOAD_STEP = 3;

export function ArticleCard({ a }: { a: HiveArticle }) {
  return (
    <Link
      href={`/hive/${a.slug}`}
      className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_8px_30px_-12px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)]"
    >
      <div className="relative aspect-[1.39]">
        <Image
          src={a.image}
          alt=""
          fill
          sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
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
  );
}

function matchesArticle(a: HiveArticle, q: string) {
  if (!q) return true;
  const haystack =
    `${a.title} ${a.description} ${a.author.name} ${a.category}`.toLowerCase();
  return haystack.includes(q);
}

type Props = {
  query?: string;
  category?: HiveCategory;
};

/**
 * "Latest Articles" — heading + 3-column responsive grid of article
 * cards. Starts with INITIAL_VISIBLE articles and reveals LOAD_STEP
 * more on each click of Load More. When the parent provides a query
 * or non-"All" category, the list is filtered and the visible count
 * resets so users see the freshest matches first.
 */
export default function HiveLatestArticles({
  query = "",
  category = "All",
}: Props) {
  const allArticles = getLatestArticles();
  const [visible, setVisible] = useState(INITIAL_VISIBLE);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allArticles.filter(
      (a) =>
        (category === "All" || a.category === category) && matchesArticle(a, q),
    );
  }, [allArticles, query, category]);

  const articles = filtered.slice(0, visible);
  const canLoadMore = visible < filtered.length;

  const q = query.trim();
  const heading = q
    ? `Results for "${q}"`
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
          {articles.map((a) => (
            <ArticleCard key={a.slug} a={a} />
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
