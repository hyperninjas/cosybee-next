import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getLearnArticleBySlug,
  getPublishedLearnSlugs,
  getRelatedLearnArticles,
} from "@/app/lib/learn-articles";
import ArticleDetail from "@/app/components/sections/blog/ArticleDetail";

/** Prerender every routable article at build time. Slugs without a
 *  body are intentionally excluded — they're card-only stubs. */
export function generateStaticParams() {
  return getPublishedLearnSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/learn/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = getLearnArticleBySlug(slug);
  if (!article?.body) return {};
  const seoTitle = article.seoTitle ?? article.title;
  return {
    title: seoTitle,
    description: article.description,
    alternates: { canonical: `/learn/${article.slug}` },
    openGraph: {
      url: `/learn/${article.slug}`,
      title: `${seoTitle} — EnergieBee`,
      description: article.description,
      type: "article",
      images: [{ url: article.image.src, alt: article.imageAlt }],
    },
  };
}

export default async function LearnArticlePage({
  params,
}: PageProps<"/learn/[slug]">) {
  const { slug } = await params;
  const article = getLearnArticleBySlug(slug);
  if (!article?.body) notFound();

  return (
    <ArticleDetail
      article={{ ...article, body: article.body }}
      related={getRelatedLearnArticles(article.slug)}
      basePath="/learn"
      backLabel="Back to Learn"
    />
  );
}
