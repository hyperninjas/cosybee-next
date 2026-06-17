// Client-safe article shape shared by the blog UI components. Kept
// free of any server imports so client components can import the type
// without dragging server code into their bundle. The API query layer
// lives in `articles.ts` (server-only).

export type Author = {
  id: string;
  name: string;
  slug: string;
  avatarUrl: string | null;
  avatarAlt?: string | null;
  avatarWidth?: number | null;
  avatarHeight?: number | null;
  bio: string | null;
  role: string | null;
  email?: string | null;
  website?: string | null;
  twitter?: string | null;
  linkedin?: string | null;
  github?: string | null;
};

export type Category = {
  id: string;
  blog: "hive" | "learn";
  name: string;
  slug: string;
  description: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  iconUrl?: string | null;
  /** CSS-token-friendly colour (e.g. `#EE3D1A` or `oklch(...)`). */
  color?: string | null;
};

export type Tag = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
};

export type Article = {
  id: string;
  /** "hive" | "learn" */
  blog: "hive" | "learn";
  slug: string;
  title: string;
  description: string;
  /** Bold subtitle under the H1 (detail view). */
  lede: string | null;

  // SEO
  /** Optional <title>/og:title override; falls back to `title`. */
  seoTitle: string | null;
  /** Optional meta-description override; falls back to `description`. */
  seoDescription: string | null;

  // Taxonomy (full objects from backend)
  author: Author;
  category: Category;
  /** Free-form topic tags. */
  tags: Tag[];

  // Media
  /** Cover image resolved for LISTINGS (cards / carousel): cover → ogImage →
   *  placeholder, so it's always a string. The article hero must NOT use this
   *  — use `coverImageReal`, so a coverless post shows no hero (the og /
   *  placeholder fallback is a listing concern only). */
  coverImage: string;
  /** The post's genuine cover image, or null when it has none — no ogImage or
   *  placeholder fallback. Used by the article hero / detail view. */
  coverImageReal: string | null;
  coverImageAlt: string;
  coverImageTitle: string | null;
  coverImageCaption: string | null;
  coverImageCredit: string | null;

  // SEO / social
  /** 1200×630 social share image; falls back to coverImage if null. */
  ogImage: string | null;
  ogImageAlt: string | null;
  canonicalUrl: string | null;
  noindex: boolean;
  /** Server-rendered schema.org Article JSON-LD (detail view only). */
  jsonLd: Record<string, unknown> | null;

  // Display
  /** Read time in minutes (integer). */
  readTime: number;
  /** ISO date string for display (e.g., "January 15, 2024"). */
  authorDate: string;

  // Featured/Carousel
  featured: boolean;
  carouselIntro: string | null;
  carouselBody: string | null;

  // CTA (flattened)
  /** Optional end-of-article call-to-action label. */
  ctaLabel: string | null;
  ctaHref: string | null;
  ctaExternal: boolean;

  // Status
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  /** ISO date the article was published. */
  publishedAt: string | null;

  // Content
  contentJson: Record<string, unknown> | null;
  /** Server-rendered article HTML (detail view only). */
  contentHtml: string | null;

  // Timestamps
  createdAt: string;
  updatedAt: string;
};

// Helper type for displaying read time
export function formatReadTime(minutes: number): string {
  return `${minutes} min read`;
}

/** Format an ISO date string for display (e.g. "5 Jun 2026"). */
export function formatDate(isoDate: string): string {
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

/**
 * External (http/https) URLs need Next's `unoptimized` to bypass the Image
 * Optimization pipeline, since the cross-origin host serves its own derivatives.
 */
export function isExternalUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

/**
 * Articles per page on the blog hubs. Used by both the server (to compute
 * total pages / rel prev-next for crawlable browse pagination) and the client
 * grid (to slice the current page / Load-More step). Client-safe.
 */
export const ARTICLES_PER_PAGE = 12;

/**
 * Placeholder cover used by listings (cards, carousel) when a post has no valid
 * cover image. The article hero deliberately skips it — a coverless article
 * shows no hero rather than a stand-in. Client-safe.
 */
export const PLACEHOLDER_COVER = "/bee-flower.png";

/** A valid image URL, or null for a missing / stale-seed (`/images/…`) path. */
export function validImageOrNull(url: string | null | undefined): string | null {
  if (!url) return null;
  // External URLs (API media, https, etc.) are valid.
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  // Local /images/ paths are seeded placeholder data that likely don't exist.
  if (url.startsWith("/images/")) return null;
  // Other local paths (like /bee-flower.png) are assumed valid.
  return url;
}

/**
 * Resolve the article cover for rendering, falling back in order:
 * cover image → social share image (ogImage) → placeholder. Always returns a
 * string, so consumers (hero, cards, og:image) never see null. Used by both the
 * public article mapper and the admin draft-preview mapper, so they stay in
 * sync. The backend's `coverImage` is nullable (a post can be coverless).
 */
export function resolveCoverImage(
  coverImage: string | null | undefined,
  ogImage: string | null | undefined,
): string {
  return (
    validImageOrNull(coverImage) ?? validImageOrNull(ogImage) ?? PLACEHOLDER_COVER
  );
}
