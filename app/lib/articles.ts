import "server-only";
import { api, type ApiPost, type Blog } from "./api";
import type { Article } from "./article-types";
import { slugify } from "./slug";

export type { Article } from "./article-types";
export type { Blog } from "./api";

/** Format minutes as "N min read" string for display. */
function formatReadTime(minutes: number): string {
  return `${minutes} min read`;
}

/** Format ISO date string to display format (e.g., "Jan 15, 2025"). */
function formatAuthorDate(isoDate: string): string {
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

/** Default placeholder image for posts without valid cover images. */
const PLACEHOLDER_IMAGE = "/bee-flower.png";

/** Check if image URL is valid (external URL or known local file). */
function getValidImageUrl(coverImage: string | null | undefined): string {
  if (!coverImage) return PLACEHOLDER_IMAGE;
  // External URLs (API media, https, etc.) are valid
  if (coverImage.startsWith("http://") || coverImage.startsWith("https://")) {
    return coverImage;
  }
  // Local paths starting with /images/ likely don't exist (seeded placeholder data)
  if (coverImage.startsWith("/images/")) {
    return PLACEHOLDER_IMAGE;
  }
  // Other local paths (like /bee-flower.png) are assumed valid
  return coverImage;
}

/** Transform API post to frontend Article shape. */
function toArticle(post: ApiPost): Article {
  return {
    id: post.id,
    blog: post.blog,
    slug: post.slug,
    category: post.category ?? "",
    readTime: formatReadTime(post.readTime ?? 1),
    title: post.title,
    seoTitle: post.seoTitle ?? undefined,
    seoDescription: post.seoDescription ?? undefined,
    description: post.description ?? "",
    tags: Array.isArray(post.tags) ? post.tags : [],
    image: getValidImageUrl(post.coverImage),
    imageAlt: post.coverImageAlt ?? "",
    author: {
      name: post.authorName ?? "energiebee",
      date: formatAuthorDate(post.authorDate ?? ""),
    },
    datePublished: post.publishedAt ?? post.authorDate ?? undefined,
    dateModified:
      post.updatedAt ?? post.publishedAt ?? post.authorDate ?? undefined,
    carouselIntro: post.carouselIntro ?? undefined,
    carouselBody: post.carouselBody ?? undefined,
    lede: post.lede ?? undefined,
    cta: post.ctaLabel
      ? {
          label: post.ctaLabel,
          href: post.ctaHref ?? undefined,
          external: post.ctaExternal ?? false,
        }
      : undefined,
    contentHtml: post.contentHtml ?? "",
  };
}

/** Published articles for a blog, newest first. */
export async function getArticles(blog: Blog): Promise<Article[]> {
  const response = await api.getPosts(blog);
  return response.data.map(toArticle);
}

/** Articles flagged for the featured carousel. */
export async function getFeatured(blog: Blog): Promise<Article[]> {
  const response = await api.getFeatured(blog);
  return response.data.map(toArticle);
}

/** Distinct categories for a blog's filter bar, prefixed with "All". */
export async function getCategories(blog: Blog): Promise<string[]> {
  const response = await api.getCategories(blog);
  return ["All", ...response.data];
}

/** A single published article with rendered body HTML. */
export async function getArticleBySlug(
  blog: Blog,
  slug: string,
): Promise<Article | null> {
  const post = await api.getPost(blog, slug);
  if (!post) return null;
  return toArticle(post);
}

/** Related articles for the in-article footer (excludes current). */
export async function getRelated(
  blog: Blog,
  slug: string,
  limit = 2,
): Promise<Article[]> {
  const response = await api.getRelated(blog, slug, limit);
  return response.data.map(toArticle);
}

/** Published slugs for a blog — used by generateStaticParams. */
export async function getPublishedSlugs(blog: Blog): Promise<string[]> {
  const response = await api.getSlugs(blog);
  return response.data;
}

/**
 * Published article paths with their real last-modified dates — used by the
 * sitemap so `<lastmod>` reflects when each post actually changed.
 */
/**
 * Fetch every published post for a blog, paginating within the API's page-size
 * limit. The API rejects large limits with a 400, so we walk pages instead.
 */
async function getAllPublishedPosts(blog: Blog): Promise<ApiPost[]> {
  const PER_PAGE = 50; // API caps the limit (larger values 400)
  const out: ApiPost[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const res = await api.getPosts(blog, page, PER_PAGE);
    out.push(...res.data);
    totalPages = res.pagination?.totalPages ?? 1;
    page++;
  } while (page <= totalPages && page <= 100); // hard safety cap
  return out;
}

/** Every published article for a blog (all pages) — for tag pages & search. */
export async function getAllArticles(blog: Blog): Promise<Article[]> {
  const posts = await getAllPublishedPosts(blog);
  return posts.map(toArticle);
}

export async function getSitemapArticles(
  blog: Blog,
): Promise<{ path: string; lastModified: Date }[]> {
  const posts = await getAllPublishedPosts(blog);
  return posts.map((p) => ({
    path: `/${blog}/${p.slug}`,
    lastModified: new Date(
      p.updatedAt || p.publishedAt || p.authorDate || Date.now(),
    ),
  }));
}

/** Unique slugified tags used by a blog's published articles (for tag pages). */
export async function getTagSlugs(blog: Blog): Promise<string[]> {
  const posts = await getAllPublishedPosts(blog);
  const slugs = new Set<string>();
  for (const p of posts) {
    for (const t of p.tags ?? []) {
      const s = slugify(t);
      if (s) slugs.add(s);
    }
  }
  return [...slugs];
}
