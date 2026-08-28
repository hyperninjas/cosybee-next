import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getArticleBySlug,
  getPublishedSlugs,
  getRelated,
} from "@/app/lib/articles";
import ArticleDetail from "@/app/components/sections/blog/ArticleDetail";
import { RSS_ALTERNATE_TYPES, TWITTER_HANDLE } from "@/app/lib/site";
import { articleSocialImage } from "@/app/lib/seo";
import {
  openGraphVideos,
  resolveArticleVideos,
} from "@/app/lib/article-videos";

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
  // og:video for any video in the body. Empty (and so omitted) for text-only
  // articles — the overwhelming majority — which keeps their share cards as
  // the large-image cards they are today.
  const videos = openGraphVideos(resolveArticleVideos(article));
  // One image object, reused by openGraph and twitter below, so the two can
  // never disagree about which card an article shares as.
  const socialImage = articleSocialImage(article, "learn");
  return {
    title: seoTitle,
    description: article.seoDescription ?? article.description,
    alternates: {
      canonical: article.canonicalUrl ?? `/learn/${article.slug}`,
      types: RSS_ALTERNATE_TYPES,
    },
    // Spread-or-omit, never `: undefined`. Next merges metadata shallowly and
    // treats a key that is *present* with an undefined value as "clear it", not
    // "inherit it" — so `robots: undefined` wiped the root layout's directives
    // and articles shipped with no robots/googlebot meta at all. They stayed
    // indexable (an absent tag means index, follow) but silently lost
    // `max-image-preview:large` and `max-snippet:-1`, the two that earn large
    // thumbnails in Discover and full-length snippets. Omitting the key lets
    // the root layout's block through. Same rule as pageMetadata (lib/seo.ts).
    ...(article.noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      url: `/learn/${article.slug}`,
      title: `${seoTitle} — EnergieBee`,
      description: article.seoDescription ?? article.description,
      type: "article",
      // An article that sets its own OG image shares as that file, untouched;
      // the rest get the generated card. See `articleSocialImage` (lib/seo.ts)
      // for which, and why the dimensions come and go with it. Works as
      // per-page metadata because there's no root opengraph-image file
      // convention to outrank it.
      images: [socialImage],
      publishedTime: article.publishedAt ?? undefined,
      modifiedTime: article.updatedAt ?? undefined,
      authors: [article.author?.name ?? "energiebee"],
      section: article.category?.name ?? undefined,
      tags: article.tags.map((t) => t.name),
      // Spread-or-omit for the same reason as `robots` above: a present key
      // holding an empty array still renders as "this page declares no video".
      ...(videos.length ? { videos } : {}),
    },
    // Must be declared even though it largely restates openGraph: X reads the
    // `twitter:*` tags in preference to `og:*`, and Next merges metadata
    // shallowly — a page that never mentions `twitter` inherits the root
    // layout's block WHOLESALE, tagline and site-wide card included. Articles
    // were therefore shared on X as the generic EnergieBee card, ignoring the
    // per-article og:image above. Same shallow-merge trap as `robots` and
    // `videos`, and the reason pageMetadata (lib/seo.ts) always emits both.
    twitter: {
      card: "summary_large_image",
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
      title: `${seoTitle} — EnergieBee`,
      description: article.seoDescription ?? article.description,
      images: [socialImage.url],
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
