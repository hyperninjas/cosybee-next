// Client-safe article shape shared by the blog UI components. Kept
// free of any server imports so client components can import the type
// without dragging server code into their bundle. The API query layer
// lives in `articles.ts` (server-only).

export type Author = {
  id: string;
  name: string;
  slug: string;
  avatarUrl: string | null;
  bio: string | null;
  role: string | null;
};

export type Category = {
  id: string;
  blog: "hive" | "learn";
  name: string;
  slug: string;
  description: string | null;
};

export type Tag = {
  id: string;
  name: string;
  slug: string;
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
  /** Public path to the cover image. */
  coverImage: string;
  coverImageAlt: string;

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
  status: "DRAFT" | "PUBLISHED";
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
