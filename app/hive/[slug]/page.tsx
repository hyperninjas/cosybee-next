import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getArticleBySlug,
  getPublishedSlugs,
  getRelated,
} from "@/app/lib/articles";
import ArticleDetail from "@/app/components/sections/blog/ArticleDetail";

/** Prerender every routable article at build time. */
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
  return {
    title: seoTitle,
    description: article.seoDescription ?? article.description,
    alternates: { canonical: `/hive/${article.slug}` },
    openGraph: {
      url: `/hive/${article.slug}`,
      title: `${seoTitle} — EnergieBee`,
      description: article.seoDescription ?? article.description,
      type: "article",
      // og:image intentionally omitted: the branded per-article
      // opengraph-image.tsx is auto-injected by Next at this route.
      publishedTime: article.publishedAt ?? undefined,
      modifiedTime: article.updatedAt ?? undefined,
      authors: [article.author?.name ?? "energiebee"],
      section: article.category?.name ?? undefined,
      tags: article.tags.map((t) => t.name),
    },
  };
}

export default async function HiveArticlePage({
  params,
}: PageProps<"/hive/[slug]">) {
  const { slug } = await params;
  const article = await getArticleBySlug("hive", slug);
  if (!article) notFound();

  const related = await getRelated("hive", slug);

  return (
    <ArticleDetail
      article={article}
      related={related}
      basePath="/hive"
      backLabel="Back to Blog"
    />
  );
}
