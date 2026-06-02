import "server-only";
import type { Post } from "@/app/generated/prisma/client";
import { prisma } from "./db";
import type { Article } from "./article-types";

export type { Article } from "./article-types";

export type Blog = "hive" | "learn";

// Columns needed for cards/listings — deliberately excludes the heavy
// contentJson/contentHtml so list queries stay light.
const CARD_FIELDS = {
  id: true,
  blog: true,
  slug: true,
  category: true,
  readTime: true,
  title: true,
  seoTitle: true,
  seoDescription: true,
  description: true,
  tags: true,
  coverImage: true,
  coverImageAlt: true,
  authorName: true,
  authorDate: true,
  carouselIntro: true,
  carouselBody: true,
} as const;

type CardRow = Pick<Post, keyof typeof CARD_FIELDS>;

/** Safely parse the JSON-encoded tags column into a string[]. */
function parseTags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((t) => typeof t === "string") : [];
  } catch {
    return [];
  }
}

function toCard(row: CardRow): Article {
  return {
    id: row.id,
    blog: row.blog,
    slug: row.slug,
    category: row.category,
    readTime: row.readTime,
    title: row.title,
    seoTitle: row.seoTitle ?? undefined,
    seoDescription: row.seoDescription ?? undefined,
    description: row.description,
    tags: parseTags(row.tags),
    image: row.coverImage,
    imageAlt: row.coverImageAlt,
    author: { name: row.authorName, date: row.authorDate },
    carouselIntro: row.carouselIntro ?? undefined,
    carouselBody: row.carouselBody ?? undefined,
  };
}

/** Published articles for a blog, newest first (card fields only). */
export async function getArticles(blog: Blog): Promise<Article[]> {
  const rows = await prisma.post.findMany({
    where: { blog, status: "PUBLISHED" },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    select: CARD_FIELDS,
  });
  return rows.map(toCard);
}

/** Articles flagged for the featured carousel (need both carousel fields). */
export async function getFeatured(blog: Blog): Promise<Article[]> {
  const rows = await prisma.post.findMany({
    where: {
      blog,
      status: "PUBLISHED",
      featured: true,
      carouselIntro: { not: null },
      carouselBody: { not: null },
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    select: CARD_FIELDS,
  });
  return rows.map(toCard);
}

/** Distinct categories for a blog's filter bar, prefixed with "All". */
export async function getCategories(blog: Blog): Promise<string[]> {
  const rows = await prisma.post.findMany({
    where: { blog, status: "PUBLISHED" },
    distinct: ["category"],
    orderBy: { category: "asc" },
    select: { category: true },
  });
  return ["All", ...rows.map((r) => r.category)];
}

/**
 * A single published article with rendered body HTML. Uses a
 * write-through cache: if `contentHtml` hasn't been rendered yet
 * (e.g. for seeded posts), render it from `contentJson` once and
 * persist it so later requests skip the work.
 */
export async function getArticleBySlug(
  blog: Blog,
  slug: string,
): Promise<Article | null> {
  const row = await prisma.post.findFirst({
    where: { blog, slug, status: "PUBLISHED" },
  });
  if (!row) return null;

  let html = row.contentHtml;
  if (!html) {
    // Lazy-load the BlockNote renderer so list pages never bundle it.
    const { contentJsonToHtml } = await import("./blocknote");
    html = await contentJsonToHtml(row.contentJson);
    await prisma.post
      .update({ where: { id: row.id }, data: { contentHtml: html } })
      .catch(() => {});
  }

  return {
    ...toCard(row),
    lede: row.lede ?? undefined,
    cta: row.ctaLabel
      ? {
          label: row.ctaLabel,
          href: row.ctaHref ?? undefined,
          external: row.ctaExternal,
        }
      : undefined,
    contentHtml: html,
  };
}

/**
 * Related articles for the in-article footer (excludes current),
 * ranked by relevance: shared tags weigh most, same category next,
 * recency breaks ties (Array.sort is stable).
 */
export async function getRelated(
  blog: Blog,
  slug: string,
  limit = 2,
): Promise<Article[]> {
  const current = await prisma.post.findFirst({
    where: { blog, slug, status: "PUBLISHED" },
    select: { tags: true, category: true },
  });
  const rows = await prisma.post.findMany({
    where: { blog, status: "PUBLISHED", slug: { not: slug } },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    select: CARD_FIELDS,
  });

  const curTags = current ? parseTags(current.tags) : [];
  const scored = rows
    .map((r) => {
      const shared = parseTags(r.tags).filter((t) => curTags.includes(t)).length;
      const sameCat = current && r.category === current.category ? 1 : 0;
      return { r, score: shared * 2 + sameCat };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => toCard(s.r));
}

/** Published slugs for a blog — used by generateStaticParams. */
export async function getPublishedSlugs(blog: Blog): Promise<string[]> {
  const rows = await prisma.post.findMany({
    where: { blog, status: "PUBLISHED" },
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
}
