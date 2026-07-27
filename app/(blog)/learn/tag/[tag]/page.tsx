import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllArticles, MIN_TAG_ARTICLES } from "@/app/lib/articles";
import { slugify } from "@/app/lib/slug";
import TaggedArticles from "@/app/components/sections/blog/TaggedArticles";
import { pageMetadata } from "@/app/lib/seo";

const BLOG = "learn" as const;
const BASE = "/learn";
const LABEL = "Learn";

/** Prerender a landing page for every tag used by a published Learn article. */
export async function generateStaticParams() {
  const articles = await getAllArticles(BLOG);
  const slugs = new Set<string>();
  for (const a of articles) {
    for (const t of a.tags) {
      const s = slugify(t.name);
      if (s) slugs.add(s);
    }
  }
  return [...slugs].map((tag) => ({ tag }));
}

export async function generateMetadata({
  params,
}: PageProps<"/learn/tag/[tag]">): Promise<Metadata> {
  const { tag } = await params;
  const articles = await getAllArticles(BLOG);
  // Match exactly as the page body does, so the count driving `index` is the
  // set of articles this page actually renders.
  const matches = articles.filter((a) =>
    a.tags.some((t) => slugify(t.name) === tag),
  );
  if (matches.length === 0)
    return { title: "Tag", robots: { index: false, follow: true } };
  const label =
    matches[0].tags.find((t) => slugify(t.name) === tag)?.name ?? tag;
  return pageMetadata({
    title: `${label} — ${LABEL}`,
    description: `Articles about ${label} on ${LABEL} — EnergieBee.`,
    ogDescription: `Articles about ${label} on ${LABEL}.`,
    path: `${BASE}/tag/${tag}`,
    // A one-article tag page just restates the article it links to, so Google
    // crawls it and declines to index. Say noindex up front and stop spending
    // crawl budget on it — `follow` keeps the article link counting.
    index: matches.length >= MIN_TAG_ARTICLES,
  });
}

export default async function LearnTagPage({
  params,
}: PageProps<"/learn/tag/[tag]">) {
  const { tag } = await params;
  const articles = await getAllArticles(BLOG);
  const matches = articles.filter((a) => a.tags.some((t) => slugify(t.name) === tag));
  if (matches.length === 0) notFound();
  const tagObj = matches[0].tags.find((t) => slugify(t.name) === tag);
  const label = tagObj?.name ?? tag.replace(/-/g, " ");

  return (
    <TaggedArticles
      label={label}
      blogLabel={LABEL}
      basePath={BASE}
      tagSlug={tag}
      articles={matches}
    />
  );
}
