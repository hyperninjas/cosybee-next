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
      // og:image is the specified OG image when set, otherwise the (resolved)
      // cover image. This per-page metadata takes effect because there's no
      // root opengraph-image file convention — that would outrank it (the
      // default card is served from /api/og as plain metadata instead).
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
