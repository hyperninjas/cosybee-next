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
  return {
    title: seoTitle,
    description: article.seoDescription ?? article.description,
    alternates: {
      canonical: article.canonicalUrl ?? `/learn/${article.slug}`,
    },
    robots: article.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      url: `/learn/${article.slug}`,
      title: `${seoTitle} — EnergieBee`,
      description: article.seoDescription ?? article.description,
      type: "article",
      // Per spec: og:image is the explicit override when set, otherwise the
      // raw cover image. Setting images here overrides any file-based
      // opengraph-image.tsx at the route.
      images: [
        {
          url: article.ogImage ?? article.coverImage,
          alt: article.ogImageAlt ?? article.coverImageAlt,
        },
      ],
      publishedTime: article.publishedAt ?? undefined,
      modifiedTime: article.updatedAt ?? undefined,
      authors: [article.author?.name ?? "energiebee"],
      section: article.category?.name ?? undefined,
      tags: article.tags.map((t) => t.name),
    },
  };
}

export default async function LearnArticlePage({
  params,
}: PageProps<"/learn/[slug]">) {
  const { slug } = await params;
  const article = await getArticleBySlug("learn", slug);
  if (!article) notFound();

  const related = await getRelated("learn", slug);

  return (
    <ArticleDetail
      article={article}
      related={related}
      basePath="/learn"
    />
  );
}
