import "server-only";
import type { Post } from "@/app/generated/prisma/client";
import { prisma } from "@/app/lib/db";
import { ROUTES } from "@/app/lib/site";
import { contentJsonToHtml } from "@/app/lib/blocknote";
import type { Article } from "@/app/lib/article-types";

export type AdminPostRow = Pick<
  Post,
  | "id"
  | "blog"
  | "slug"
  | "title"
  | "category"
  | "status"
  | "featured"
  | "coverImage"
  | "updatedAt"
>;

/** All posts for the dashboard (drafts included), newest first. */
export async function listPosts(): Promise<AdminPostRow[]> {
  return prisma.post.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      blog: true,
      slug: true,
      title: true,
      category: true,
      status: true,
      featured: true,
      coverImage: true,
      updatedAt: true,
    },
  });
}

/** A single post for the edit form (full row). */
export async function getPost(id: string): Promise<Post | null> {
  return prisma.post.findUnique({ where: { id } });
}

function tagsOf(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((t) => typeof t === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Map any post (draft or published) to the public Article shape, with
 * rendered HTML — used by the admin draft-preview page, which must show
 * unpublished content the public site won't.
 */
export async function getPostArticle(id: string): Promise<Article | null> {
  const row = await prisma.post.findUnique({ where: { id } });
  if (!row) return null;
  const contentHtml = row.contentHtml || (await contentJsonToHtml(row.contentJson));
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
    tags: tagsOf(row.tags),
    image: row.coverImage,
    imageAlt: row.coverImageAlt,
    author: { name: row.authorName, date: row.authorDate },
    carouselIntro: row.carouselIntro ?? undefined,
    carouselBody: row.carouselBody ?? undefined,
    lede: row.lede ?? undefined,
    cta: row.ctaLabel
      ? { label: row.ctaLabel, href: row.ctaHref ?? undefined, external: row.ctaExternal }
      : undefined,
    contentHtml,
  };
}

/** Distinct categories across all posts (admin autocomplete). */
export async function getAllCategories(): Promise<string[]> {
  const rows = await prisma.post.findMany({
    distinct: ["category"],
    orderBy: { category: "asc" },
    select: { category: true },
  });
  return rows.map((r) => r.category).filter(Boolean);
}

/** All tags used across posts, flattened + deduped + sorted. */
export async function getAllTags(): Promise<string[]> {
  const rows = await prisma.post.findMany({ select: { tags: true } });
  const set = new Set<string>();
  for (const r of rows) {
    try {
      const parsed = JSON.parse(r.tags);
      if (Array.isArray(parsed)) {
        for (const t of parsed) if (typeof t === "string" && t) set.add(t);
      }
    } catch {
      // ignore malformed rows
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

/**
 * Internal link targets for the CTA picker: the canonical site routes
 * plus every published article path. Used as searchable suggestions.
 */
export async function getInternalRoutes(): Promise<string[]> {
  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { updatedAt: "desc" },
    select: { blog: true, slug: true },
  });
  const articlePaths = posts.map((p) => `/${p.blog}/${p.slug}`);
  const staticPaths = ROUTES.map((r) => r.path);
  return [...new Set([...staticPaths, ...articlePaths])];
}
