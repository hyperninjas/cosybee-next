import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getTagArticles,
  getTagSummaries,
  isIndexableTag,
} from "@/app/lib/articles";
import TaggedArticles from "@/app/components/sections/blog/TaggedArticles";
import { pageMetadata } from "@/app/lib/seo";

const BLOG = "learn" as const;
const BASE = "/learn";
const LABEL = "Learn";

/**
 * Prerender a landing page for every tag used by a published Learn article.
 * Same source as the sitemap and the tag chips (`tag.slug`), so the params, the
 * links and the listed URLs are always the same set.
 */
export async function generateStaticParams() {
  const tags = await getTagSummaries(BLOG);
  return tags.map((t) => ({ tag: t.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/learn/tag/[tag]">): Promise<Metadata> {
  const { tag } = await params;
  const match = await getTagArticles(BLOG, tag);
  if (!match) return { title: "Tag", robots: { index: false, follow: true } };
  return pageMetadata({
    title: `${match.label} — ${LABEL}`,
    description: `Articles about ${match.label} on ${LABEL} — EnergieBee.`,
    ogDescription: `Articles about ${match.label} on ${LABEL}.`,
    path: `${BASE}/tag/${tag}`,
    // A one-article tag page just restates the article it links to, so Google
    // crawls it and declines to index. Say noindex up front and stop spending
    // crawl budget on it — `follow` keeps the article link counting. The same
    // predicate decides whether the sitemap lists this URL.
    index: isIndexableTag(match.articles.length),
  });
}

export default async function LearnTagPage({
  params,
}: PageProps<"/learn/tag/[tag]">) {
  const { tag } = await params;
  const match = await getTagArticles(BLOG, tag);
  if (!match) notFound();

  return (
    <TaggedArticles
      label={match.label}
      blogLabel={LABEL}
      basePath={BASE}
      tagSlug={tag}
      articles={match.articles}
    />
  );
}
