// Client-safe article shape shared by the blog UI components. Kept
// free of any server imports so client components can import the type
// without dragging server code into their bundle. The API query layer
// lives in `articles.ts` (server-only).

export type Article = {
  id: string;
  /** "hive" | "learn" */
  blog: string;
  slug: string;
  category: string;
  readTime: string;
  title: string;
  /** Optional <title>/og:title override; falls back to `title`. */
  seoTitle?: string;
  /** Optional meta-description override; falls back to `description`. */
  seoDescription?: string;
  description: string;
  /** Free-form topic tags. */
  tags: string[];
  /** Public path to the cover image. */
  image: string;
  imageAlt: string;
  author: { name: string; date: string };
  /** ISO date the article was published — for structured data / OG tags. */
  datePublished?: string;
  /** ISO date the article was last modified — for structured data / OG tags. */
  dateModified?: string;
  carouselIntro?: string;
  carouselBody?: string;
  /** Bold subtitle under the H1 (detail view). */
  lede?: string;
  /** Optional end-of-article call-to-action. */
  cta?: { label: string; href?: string; external?: boolean };
  /** Server-rendered article HTML (detail view only). */
  contentHtml?: string;
};
