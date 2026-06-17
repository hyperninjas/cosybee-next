import "server-only";
import { ROUTES } from "@/app/lib/site";
import {
  resolveCoverImage,
  validImageOrNull,
  type Article,
  type Author,
  type Category,
  type Tag,
} from "@/app/lib/article-types";
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
    title: row.title,
    description: row.description,
    lede: row.lede,

    // SEO
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,

    // Taxonomy (full objects)
    author: row.author,
    category: row.category,
    tags: row.tags ?? [],

    // Media
    // Listings get the resolved value (cover → og → placeholder); the draft
    // preview's hero uses `coverImageReal` so a coverless draft shows no hero.
    coverImage: resolveCoverImage(row.coverImage, row.ogImage),
    coverImageReal: validImageOrNull(row.coverImage),
    coverImageAlt: row.coverImageAlt,
    coverImageTitle: row.coverImageTitle ?? null,
    coverImageCaption: row.coverImageCaption ?? null,
    coverImageCredit: row.coverImageCredit ?? null,

    // SEO / social
    ogImage: row.ogImage ?? null,
    ogImageAlt: row.ogImageAlt ?? null,
    canonicalUrl: row.canonicalUrl ?? null,
    noindex: row.noindex ?? false,
    jsonLd: row.jsonLd ?? null,

    // Display
    readTime: row.readTime,
    authorDate: row.authorDate,

    // Featured/Carousel
    featured: row.featured,
    carouselIntro: row.carouselIntro,
    carouselBody: row.carouselBody,

    // CTA (flattened)
    ctaLabel: row.ctaLabel,
    ctaHref: row.ctaHref,
    ctaExternal: row.ctaExternal,

    // Status
    status: row.status,
    publishedAt: row.publishedAt,

    // Content
    contentJson: row.contentJson,
    contentHtml: row.contentHtml,

    // Timestamps
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** Distinct categories across all posts (admin autocomplete). */
export async function getAllCategories(): Promise<Category[]> {
  return adminApi.getAllCategories();
}

/** Get categories for a specific blog. */
export async function getCategories(blog: "hive" | "learn"): Promise<Category[]> {
  return adminApi.getCategories(blog);
}

/** All tags used across posts. */
export async function getAllTags(): Promise<Tag[]> {
  return adminApi.getAllTags();
}

/** Get tags for a specific blog. */
export async function getTags(blog: "hive" | "learn"): Promise<Tag[]> {
  return adminApi.getTags(blog);
}

/** All authors. */
export async function getAuthors(): Promise<Author[]> {
  return adminApi.getAuthors();
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
