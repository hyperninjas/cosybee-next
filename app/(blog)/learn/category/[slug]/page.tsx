import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getCategoryArticles,
  getCategorySummaries,
  isIndexableCategory,
} from "@/app/lib/articles";
import CategoryArticles from "@/app/components/sections/blog/CategoryArticles";
import { pageMetadata } from "@/app/lib/seo";

const BLOG = "learn" as const;
const BASE = "/learn";
const LABEL = "Learn";

/**
 * Prerender a landing page for every category a published Learn article is
 * filed under. Same source as the sitemap and the chips (`category.slug`), so
 * the params, the links and the listed URLs are always the same set.
 */
export async function generateStaticParams() {
  const categories = await getCategorySummaries(BLOG);
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/learn/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const match = await getCategoryArticles(BLOG, slug);
  if (!match) {
    return { title: "Category", robots: { index: false, follow: true } };
  }
  return pageMetadata({
    title: `${match.label} — ${LABEL}`,
    description: `${match.label} guides and tutorials on ${LABEL} — energy-saving advice from EnergieBee.`,
    ogDescription: `${match.label} guides and tutorials on ${LABEL}.`,
    path: `${BASE}/category/${slug}`,
    // The same predicate decides whether the sitemap lists this URL, so the
    // page and the sitemap can never disagree. See isIndexableCategory.
    index: isIndexableCategory(match.articles.length),
  });
}

export default async function LearnCategoryPage({
  params,
}: PageProps<"/learn/category/[slug]">) {
  const { slug } = await params;
  const [match, categories] = await Promise.all([
    getCategoryArticles(BLOG, slug),
    getCategorySummaries(BLOG),
  ]);
  if (!match) notFound();

  return (
    <CategoryArticles
      label={match.label}
      blogLabel={LABEL}
      basePath={BASE}
      categorySlug={slug}
      categories={categories}
      articles={match.articles}
    />
  );
}
