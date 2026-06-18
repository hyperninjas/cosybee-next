import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllArticles } from "@/app/lib/articles";
import { slugify } from "@/app/lib/slug";
import TaggedArticles from "@/app/components/sections/blog/TaggedArticles";
import { pageMetadata } from "@/app/lib/seo";

const BLOG = "hive" as const;
const BASE = "/hive";
const LABEL = "The Hive";

/** Prerender a landing page for every tag used by a published Hive article. */
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
}: PageProps<"/hive/tag/[tag]">): Promise<Metadata> {
  const { tag } = await params;
  const articles = await getAllArticles(BLOG);
  const tagObj = articles
    .flatMap((a) => a.tags)
    .find((t) => slugify(t.name) === tag);
  if (!tagObj) return { title: "Tag", robots: { index: false, follow: true } };
  const label = tagObj.name;
  return pageMetadata({
    title: `${label} — ${LABEL}`,
    description: `Articles about ${label} on ${LABEL} — EnergieBee.`,
    ogDescription: `Articles about ${label} on ${LABEL}.`,
    path: `${BASE}/tag/${tag}`,
  });
}

export default async function HiveTagPage({
  params,
}: PageProps<"/hive/tag/[tag]">) {
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
