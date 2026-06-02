import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getArticleBySlug,
  getPublishedSlugs,
  getRelated,
} from "@/app/lib/articles";
import ArticleDetail from "@/app/components/sections/blog/ArticleDetail";

/** Prerender published articles at build time. New posts created in
 *  the admin render on demand (dynamicParams defaults to true). */
export async function generateStaticParams() {
  const slugs = await getPublishedSlugs("hive");
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/hive/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug("hive", slug);
  if (!article) return {};
  const seoTitle = article.seoTitle ?? article.title;
  const seoDescription = article.seoDescription ?? article.description;
  return {
    title: seoTitle,
    description: seoDescription,
    keywords: article.tags.length ? article.tags : undefined,
    alternates: { canonical: `/hive/${article.slug}` },
    openGraph: {
      url: `/hive/${article.slug}`,
      title: `${seoTitle} — energiebee`,
      description: seoDescription,
      type: "article",
      // og:image is supplied by the colocated opengraph-image.tsx.
    },
  };
}

export default async function HiveArticlePage({
  params,
}: PageProps<"/hive/[slug]">) {
  const { slug } = await params;
  const article = await getArticleBySlug("hive", slug);
  if (!article) notFound();

  const related = await getRelated("hive", article.slug);

  return (
    <ArticleDetail
      article={article}
      related={related}
      basePath="/hive"
      backLabel="Back to Blog"
    />
  );
}
