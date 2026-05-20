import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getArticleBySlug,
  getPublishedSlugs,
  getRelatedArticles,
} from "@/app/lib/hive-articles";
import ArticleDetail from "@/app/components/sections/blog/ArticleDetail";

/** Prerender every routable article at build time. Slugs without a
 *  body are intentionally excluded — they're card-only stubs. */
export function generateStaticParams() {
  return getPublishedSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/hive/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article?.body) return {};
  const seoTitle = article.seoTitle ?? article.title;
  return {
    title: seoTitle,
    description: article.description,
    alternates: { canonical: `/hive/${article.slug}` },
    openGraph: {
      url: `/hive/${article.slug}`,
      title: `${seoTitle} — energiebee`,
      description: article.description,
      type: "article",
      images: [{ url: article.image.src, alt: article.imageAlt }],
    },
  };
}

export default async function HiveArticlePage({
  params,
}: PageProps<"/hive/[slug]">) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article?.body) notFound();

  return (
    <ArticleDetail
      article={{ ...article, body: article.body }}
      related={getRelatedArticles(article.slug)}
      basePath="/hive"
      backLabel="Back to Blog"
    />
  );
}
