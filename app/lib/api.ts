import "server-only";

import type { Author, Category, Tag } from "./article-types";

const API_BASE = process.env.API_URL || "http://localhost:3000";

export type Blog = "hive" | "learn";

/** Post shape returned by the backend API. */
export interface ApiPost {
  id: string;
  blog: "hive" | "learn";
  slug: string;
  title: string;
  description: string;
  lede: string | null;
  seoTitle: string | null;
  seoDescription: string | null;

  // Taxonomy - supports both old format (strings) and new format (objects)
  author?: Author;
  authorName?: string; // Old format fallback
  category?: Category | string; // Can be string (old) or Category object (new)
  tags: (Tag | string)[];

  // Media — cover is optional (a post can be coverless; the mapper falls back
  // to the social image, then a placeholder).
  coverImage: string | null;
  coverImageAlt: string;
  coverImageTitle?: string | null;
  coverImageCaption?: string | null;
  coverImageCredit?: string | null;

  // SEO / social
  ogImage?: string | null;
  ogImageAlt?: string | null;
  canonicalUrl?: string | null;
  noindex?: boolean;
  /** Backend-rendered Article JSON-LD. Detail endpoint only. */
  jsonLd?: Record<string, unknown> | null;

  // Display
  /** Minutes (integer) — format as "N min read" on display. */
  readTime: number;
  /** ISO date string from backend DateTime. */
  authorDate: string;

  // Featured/Carousel
  featured: boolean;
  homeFeatured: boolean;
  carouselIntro: string | null;
  carouselBody: string | null;

  // CTA
  ctaLabel: string | null;
  ctaHref: string | null;
  ctaExternal: boolean;

  // Status
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt: string | null;

  // Content
  contentJson?: Record<string, unknown>;
  contentHtml?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * One entry of the footer's phrase rotation, as the backend returns it
 * (eb-auth `src/modules/phrases`). `articleLabel` is admin-facing only.
 */
export interface ApiPhrase {
  id: string;
  quote: string;
  author: string;
  articlePath: string;
  articleLabel: string | null;
  position: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface DataResponse<T> {
  data: T;
}

/**
 * Cache tag applied to every public content read. An admin mutation calls
 * `revalidateContent()` (lib/revalidate.ts), which drops every entry carrying
 * this tag plus the files derived from them (sitemap, feeds).
 *
 * Without it, the sitemap would only ever catch up when the 60s `revalidate`
 * below lapses — freshness by accident of this file rather than by policy.
 */
export const CONTENT_TAG = "content";

/**
 * Shared cache policy for public reads: 60s TTL as a backstop, plus the tag
 * that lets an admin mutation invalidate on demand. Returned fresh per call —
 * `fetch` takes ownership of the object it's handed.
 */
function contentCache(): NextFetchRequestConfig {
  return { revalidate: 60, tags: [CONTENT_TAG] };
}

async function fetchJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { next: contentCache() });
    if (!res.ok) {
      console.warn(`API ${path}: ${res.status} ${res.statusText}`);
      return fallback;
    }
    return res.json() as Promise<T>;
  } catch (err) {
    // API unreachable (e.g., during build without backend)
    console.warn(`API ${path} unreachable:`, err);
    return fallback;
  }
}

/**
 * Where a post that has left an address lives now (`/api/posts/:blog/:slug/resolve`).
 * `isLive` is false when the post has since become a draft or been archived —
 * a redirect there would only reach another 404.
 */
export type SlugRedirect = {
  /** The post now at this address — used to exclude self when checking a slug. */
  id: string;
  blog: Blog;
  slug: string;
  title: string;
  isLive: boolean;
};

async function fetchJsonOrNull<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { next: contentCache() });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

/**
 * Like `fetchJson`, but throws instead of substituting a fallback.
 *
 * The fallback is right for a listing section — an empty carousel beats a 500.
 * It is wrong for anything that enumerates the whole site (sitemap, tag and
 * author archives): there, an empty or short answer is indistinguishable from
 * "these pages no longer exist", and gets cached and served to Google as if it
 * were the truth. Throwing keeps the last known-good output in place instead.
 *
 * Same URL and cache options as `fetchJson`, so a strict and a tolerant read of
 * the same endpoint share one Data Cache entry — no extra requests.
 */
async function fetchJsonOrThrow<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { next: contentCache() });
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

/**
 * Detail read for a whole-catalogue crawl.
 *
 * Sits between the tolerant `fetchJsonOrNull` and the strict `fetchJsonOrThrow`
 * because a by-slug read during a crawl has two distinguishable failures. A 404
 * means the post was unpublished in the window between listing the catalogue
 * and reading this entry — genuinely gone, so skipping it is correct and the
 * rest of the crawl is still true. Anything else (5xx, network) is the backend
 * faltering, where a short answer would be published as if it were the truth;
 * that throws, and the caller keeps serving its last good output.
 */
async function fetchDetailForCrawl<T>(path: string): Promise<T | null> {
  const res = await fetch(`${API_BASE}${path}`, { next: contentCache() });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

const EMPTY_PAGINATED: PaginatedResponse<ApiPost> = {
  data: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
};

export const api = {
  /** List published posts (paginated). */
  async getPosts(
    blog: Blog,
    page = 1,
    limit = 50,
    category?: string,
  ): Promise<PaginatedResponse<ApiPost>> {
    const params = new URLSearchParams({
      blog,
      page: String(page),
      limit: String(limit),
    });
    if (category) params.set("category", category);
    return fetchJson(`/api/posts?${params}`, EMPTY_PAGINATED);
  },

  /**
   * Same request as `getPosts`, but a failure throws rather than resolving to
   * an empty page. Used by the full-catalogue crawl behind the sitemap, feeds
   * and archive pages — see `fetchJsonOrThrow`.
   */
  async getPostsStrict(
    blog: Blog,
    page = 1,
    limit = 50,
  ): Promise<PaginatedResponse<ApiPost>> {
    const params = new URLSearchParams({
      blog,
      page: String(page),
      limit: String(limit),
    });
    return fetchJsonOrThrow(`/api/posts?${params}`);
  },

  /** Featured posts for carousel. */
  async getFeatured(blog: Blog): Promise<DataResponse<ApiPost[]>> {
    return fetchJson(`/api/posts/featured?blog=${blog}`, { data: [] });
  },

  /** Posts flagged for the home-page featured section. */
  async getHomeFeatured(blog: Blog): Promise<DataResponse<ApiPost[]>> {
    return fetchJson(`/api/posts/home-featured?blog=${blog}`, { data: [] });
  },

  /** Distinct categories for filter bar (now returns full Category objects). */
  async getCategories(blog: Blog): Promise<DataResponse<Category[]>> {
    return fetchJson(`/api/posts/categories?blog=${blog}`, { data: [] });
  },

  /** All tags for a blog. */
  async getTags(blog: Blog): Promise<DataResponse<Tag[]>> {
    return fetchJson(`/api/posts/tags?blog=${blog}`, { data: [] });
  },

  /** All authors. */
  async getAuthors(): Promise<DataResponse<Author[]>> {
    return fetchJson(`/api/posts/authors`, { data: [] });
  },

  /**
   * Active entries of the footer's "Phrase of the Week" rotation, in the order
   * an admin arranged them (/admin/phrases).
   *
   * Tolerant like the listing reads, not strict: an empty answer here costs one
   * footer element, which the component covers with its built-in fallback list
   * — nothing about the site's crawlable surface depends on it.
   */
  async getPhrases(): Promise<DataResponse<ApiPhrase[]>> {
    return fetchJson(`/api/phrases`, { data: [] });
  },

  /** Single article by slug (includes contentHtml). */
  async getPost(blog: Blog, slug: string): Promise<ApiPost | null> {
    return fetchJsonOrNull(`/api/posts/${blog}/${slug}`);
  },

  /**
   * Where a retired address points now, or null if nothing was ever published
   * there. Only asked on a miss, so an ordinary article read never pays for it.
   */
  async resolvePostSlug(
    blog: Blog,
    slug: string,
  ): Promise<SlugRedirect | null> {
    return fetchJsonOrNull(`/api/posts/${blog}/${slug}/resolve`);
  },

  /**
   * Same request as `getPost` — so it shares one Data Cache entry with the
   * article page's own read, no extra traffic — but a server error throws
   * instead of reading as "no such post". Used by the video sitemap, which
   * needs `contentJson` and only the detail endpoint carries it (list
   * responses strip contentJson, contentHtml and jsonLd).
   */
  async getPostForCrawl(blog: Blog, slug: string): Promise<ApiPost | null> {
    return fetchDetailForCrawl(`/api/posts/${blog}/${slug}`);
  },

  /** Related articles for in-article footer. */
  async getRelated(
    blog: Blog,
    slug: string,
    limit = 2,
  ): Promise<DataResponse<ApiPost[]>> {
    return fetchJson(`/api/posts/${blog}/${slug}/related?limit=${limit}`, { data: [] });
  },

  /** All published slugs for generateStaticParams. */
  async getSlugs(blog: Blog): Promise<DataResponse<string[]>> {
    return fetchJson(`/api/posts/slugs?blog=${blog}`, { data: [] });
  },

  /** Build full media URL from ID. */
  getMediaUrl(id: string): string {
    return `${API_BASE}/api/media/${id}`;
  },
};
