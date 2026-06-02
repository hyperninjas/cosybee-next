import "server-only";
import { ROUTES } from "@/app/lib/site";
import type { Article } from "@/app/lib/article-types";
import { adminApi, type AdminPost, type AdminPostRow } from "./api";

export type { AdminPostRow } from "./api";

/** All posts for the dashboard (drafts included), newest first. */
export async function listPosts(): Promise<AdminPostRow[]> {
  return adminApi.listPosts();
}

/** A single post for the edit form (full row). */
export async function getPost(id: string): Promise<AdminPost | null> {
  return adminApi.getPost(id);
}

/**
 * Map any post (draft or published) to the public Article shape.
 * Used by the admin draft-preview page.
 */
export async function getPostArticle(id: string): Promise<Article | null> {
  const row = await adminApi.getPost(id);
  if (!row) return null;

  return {
    id: row.id,
    blog: row.blog,
    slug: row.slug,
    category: row.category,
    readTime: `${row.readTime} min read`,
    title: row.title,
    seoTitle: row.seoTitle ?? undefined,
    seoDescription: row.seoDescription ?? undefined,
    description: row.description,
    tags: row.tags ?? [],
    image: row.coverImage,
    imageAlt: row.coverImageAlt,
    author: {
      name: row.authorName,
      date: formatDate(row.authorDate),
    },
    carouselIntro: row.carouselIntro ?? undefined,
    carouselBody: row.carouselBody ?? undefined,
    lede: row.lede ?? undefined,
    cta: row.ctaLabel
      ? { label: row.ctaLabel, href: row.ctaHref ?? undefined, external: row.ctaExternal }
      : undefined,
    contentHtml: row.contentHtml ?? "",
  };
}

/** Format ISO date to display format. */
function formatDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return isoDate;
  }
}

/** Distinct categories across all posts (admin autocomplete). */
export async function getAllCategories(): Promise<string[]> {
  return adminApi.getAllCategories();
}

/** All tags used across posts, flattened + deduped + sorted. */
export async function getAllTags(): Promise<string[]> {
  return adminApi.getAllTags();
}

/**
 * Internal link targets for the CTA picker: the canonical site routes
 * plus every published article path. Used as searchable suggestions.
 */
export async function getInternalRoutes(): Promise<string[]> {
  const staticPaths = ROUTES.map((r) => r.path);
  // For now, just return static paths
  // Could fetch published posts from API if needed
  return staticPaths;
}
