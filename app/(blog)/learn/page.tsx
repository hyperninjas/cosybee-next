import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogHero from "../components/sections/blog/BlogHero";
import BlogBrowse from "../components/sections/blog/BlogBrowse";
import { getAllArticles, getFeatured, getCategoryNames } from "../lib/articles";
import { ARTICLES_PER_PAGE } from "../lib/article-types";
import JsonLd from "../components/JsonLd";
import { breadcrumbSchema } from "../lib/structured-data";
import { url } from "../lib/site";
import learnCover from "@/public/Cover/energiebee-learn-cover.png";

const LEARN_DESCRIPTION =
  "Guides, tutorials, and energy-saving tips from the EnergieBee team.";

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
}: PageProps<"/learn">): Promise<Metadata> {
  const sp = await searchParams;
  const filtered = Boolean(
    firstParam(sp.q) || firstParam(sp.category) || firstParam(sp.tag),
  );
  const page = parsePage(sp.page);
  // Browse pages are self-canonical; filtered/search views are shareable but
  // canonicalised to the clean hub and marked noindex (thin/duplicate).
  const canonical = !filtered && page > 1 ? `/learn?page=${page}` : "/learn";
  return {
    title: "Learn",
    description: LEARN_DESCRIPTION,
    alternates: { canonical },
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      url: canonical,
      title: "Learn — EnergieBee",
      description: LEARN_DESCRIPTION,
    },
  };
}

export default async function LearnPage({
  searchParams,
}: PageProps<"/learn">) {
  const sp = await searchParams;
  const filtered = Boolean(
    firstParam(sp.q) || firstParam(sp.category) || firstParam(sp.tag),
  );
  const page = parsePage(sp.page);

  const [articles, featured, categories] = await Promise.all([
    getAllArticles("learn"),
    getFeatured("learn"),
    getCategoryNames("learn"),
  ]);

  const totalPages = Math.max(1, Math.ceil(articles.length / ARTICLES_PER_PAGE));
  // Out-of-range browse page → 404 rather than a thin, empty soft-404.
  if (!filtered && page > totalPages) notFound();

  return (
    <main className="flex-1">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Learn", path: "/learn" },
        ])}
      />
      {/* Crawlable prev/next hints for the browse pagination (React 19 hoists
          these to <head>). Omitted in filter/search mode. */}
      {!filtered && page > 1 && (
        <link rel="prev" href={url(page === 2 ? "/learn" : `/learn?page=${page - 1}`)} />
      )}
      {!filtered && page < totalPages && (
        <link rel="next" href={url(`/learn?page=${page + 1}`)} />
      )}
      <BlogHero
        title="Learn"
        description={LEARN_DESCRIPTION}
        bgImage={learnCover}
        crumbs={[
          { name: "Home", path: "/" },
          { name: "Learn", path: "/learn" },
        ]}
      />
      <BlogBrowse
        articles={articles}
        featured={featured}
        categories={categories}
        basePath="/learn"
        initialQuery={firstParam(sp.q) ?? ""}
        initialCategory={firstParam(sp.category) ?? "All"}
        initialTag={firstParam(sp.tag) ?? ""}
        page={page}
      />
    </main>
  );
}
