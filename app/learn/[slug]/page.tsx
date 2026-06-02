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
  const slugs = await getPublishedSlugs("learn");
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/learn/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug("learn", slug);
  if (!article) return {};
  const seoTitle = article.seoTitle ?? article.title;
  const seoDescription = article.seoDescription ?? article.description;
  return {
    title: seoTitle,
    description: seoDescription,
    keywords: article.tags.length ? article.tags : undefined,
    alternates: { canonical: `/learn/${article.slug}` },
    openGraph: {
      url: `/learn/${article.slug}`,
      title: `${seoTitle} — energiebee`,
      description: seoDescription,
      type: "article",
      // og:image is supplied by the colocated opengraph-image.tsx.
    },
  };
}

export default async function LearnArticlePage({
  params,
}: PageProps<"/learn/[slug]">) {
  const { slug } = await params;
  const article = await getArticleBySlug("learn", slug);
  if (!article) notFound();

  const related = await getRelated("learn", article.slug);

  return (
    <ArticleDetail
      article={article}
      related={related}
      basePath="/learn"
      backLabel="Back to Learn"
    />
  );
}
