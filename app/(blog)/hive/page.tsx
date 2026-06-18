import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogHero from "@/app/components/sections/blog/BlogHero";
import BlogBrowse from "@/app/components/sections/blog/BlogBrowse";
import {
  getAllArticles,
  getFeatured,
  getCategoryNames,
} from "@/app/lib/articles";
import { ARTICLES_PER_PAGE } from "@/app/lib/article-types";
import JsonLd from "@/app/components/JsonLd";
import { breadcrumbSchema } from "@/app/lib/structured-data";
import { url } from "@/app/lib/site";
import { pageMetadata } from "@/app/lib/seo";
import hiveCover from "@/public/Cover/energiebee-hive-cover.png";

const HIVE_DESCRIPTION =
  "Insights, stories, and expert advice on sustainable energy solutions for modern homes.";

/** First value of a search param (handles the string | string[] shape). */
function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Parse a `?page=` value to a page number ≥ 1. */
function parsePage(value: string | string[] | undefined): number {
  const n = Number(firstParam(value));
  return Number.isInteger(n) && n > 1 ? n : 1;
}

export async function generateMetadata({
  searchParams,
}: PageProps<"/hive">): Promise<Metadata> {
  const sp = await searchParams;
  const filtered = Boolean(
    firstParam(sp.q) || firstParam(sp.category) || firstParam(sp.tag),
  );
  const page = parsePage(sp.page);
  // Browse pages are self-canonical (so deep pages index independently).
  // Filtered/search views are shareable but canonicalised to the clean hub and
  // marked noindex so they aren't indexed as thin, duplicate pages.
  const canonical = !filtered && page > 1 ? `/hive?page=${page}` : "/hive";
  return pageMetadata({
    title: "The Hive",
    description: HIVE_DESCRIPTION,
    path: canonical,
    index: !filtered,
  });
}

export default async function HivePage({ searchParams }: PageProps<"/hive">) {
  const sp = await searchParams;
  const filtered = Boolean(
    firstParam(sp.q) || firstParam(sp.category) || firstParam(sp.tag),
  );
  const page = parsePage(sp.page);

  const [articles, featured, categories] = await Promise.all([
    getAllArticles("hive"),
    getFeatured("hive"),
    getCategoryNames("hive"),
  ]);
  const totalPages = Math.max(
    1,
    Math.ceil(articles.length / ARTICLES_PER_PAGE),
  );
  // Out-of-range browse page → 404 rather than a thin, empty soft-404.
  if (!filtered && page > totalPages) notFound();

  return (
    <main className="flex-1">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "The Hive", path: "/hive" },
        ])}
      />
      {/* Crawlable prev/next hints for the browse pagination (React 19 hoists
          these to <head>). Omitted in filter/search mode. */}
      {!filtered && page > 1 && (
        <link
          rel="prev"
          href={url(page === 2 ? "/hive" : `/hive?page=${page - 1}`)}
        />
      )}
      {!filtered && page < totalPages && (
        <link rel="next" href={url(`/hive?page=${page + 1}`)} />
      )}
      <BlogHero
        title="The Hive"
        description={HIVE_DESCRIPTION}
        bgImage={hiveCover}
        crumbs={[
          { name: "Home", path: "/" },
          { name: "The Hive", path: "/hive" },
        ]}
      />
      <BlogBrowse
        articles={articles}
        featured={featured}
        categories={categories}
        basePath="/hive"
        initialQuery={firstParam(sp.q) ?? ""}
        initialCategory={firstParam(sp.category) ?? "All"}
        initialTag={firstParam(sp.tag) ?? ""}
        page={page}
      />
    </main>
  );
}
