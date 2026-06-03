import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllArticles } from "@/app/lib/articles";
import { slugify } from "@/app/lib/slug";
import TaggedArticles from "@/app/components/sections/blog/TaggedArticles";

const BLOG = "learn" as const;
const BASE = "/learn";
const LABEL = "Learn";

/** Prerender a landing page for every tag used by a published Learn article. */
export async function generateStaticParams() {
  const articles = await getAllArticles(BLOG);
  const slugs = new Set<string>();
  for (const a of articles) {
    for (const t of a.tags) {
      const s = slugify(t);
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
  const label = articles
    .flatMap((a) => a.tags)
    .find((t) => slugify(t) === tag);
  if (!label) return { title: "Tag", robots: { index: false, follow: true } };
  return {
    title: `${label} — ${LABEL}`,
    description: `Articles about ${label} on ${LABEL} — EnergieBee.`,
    alternates: { canonical: `${BASE}/tag/${tag}` },
    openGraph: {
      url: `${BASE}/tag/${tag}`,
      title: `${label} — ${LABEL} — EnergieBee`,
      description: `Articles about ${label} on ${LABEL}.`,
    },
  };
}

export default async function LearnTagPage({
  params,
}: PageProps<"/learn/tag/[tag]">) {
  const { tag } = await params;
  const articles = await getAllArticles(BLOG);
  const matches = articles.filter((a) => a.tags.some((t) => slugify(t) === tag));
  if (matches.length === 0) notFound();
  const label =
    matches[0].tags.find((t) => slugify(t) === tag) ?? tag.replace(/-/g, " ");

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
