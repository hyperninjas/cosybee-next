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
      // og:image is the article's specified OG image, else its cover —
      // served through /api/og/article/* which crops to 1200×630 and
      // compresses under WhatsApp's ~300 KB limit (raw covers are too big, so
      // WhatsApp would show no preview). Width/height help crawlers pick the
      // large-image card. Works as per-page metadata because there's no root
      // opengraph-image file convention to outrank it.
      images: [
        {
          url: `/api/og/article/learn/${article.slug}`,
          width: 1200,
          height: 630,
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
