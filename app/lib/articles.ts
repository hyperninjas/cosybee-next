import type { StaticImageData } from "next/image";

/** A single content block inside a section. Strings render as
 *  paragraphs; `{ items }` objects render as bulleted lists. */
export type ArticleBlock = string | { items: string[] };

export type ArticleSection = {
  /** Section heading. Omit for an unheaded lead/intro block. */
  heading?: string;
  /** Plain paragraphs. Use this for simple prose sections. */
  paragraphs?: string[];
  /** Mixed paragraphs and lists. Strings render as <p>, objects with
   *  `items` render as <ul>. Wins over `paragraphs` when both set. */
  blocks?: ArticleBlock[];
};

export type ArticleBody = {
  /** Bold subtitle rendered under the article H1. */
  lede?: string;
  sections: ArticleSection[];
  /** Optional photo rendered after the last section, full-width. */
  inlineImage?: { src: StaticImageData; alt: string };
  /** Optional call-to-action button rendered at the end of the body. */
  cta?: { label: string; href?: string };
};

export type Article = {
  slug: string;
  category: string;
  readTime: string;
  /** Visible H1 / card title. */
  title: string;
  /** Optional <title> + og:title override for search engines. Falls
   *  back to `title` when omitted. */
  seoTitle?: string;
  /** Short blurb shown on cards (latest grid + related). */
  description: string;
  image: StaticImageData;
  imageAlt: string;
  author: { name: string; date: string };
  /** Two-line hook shown in the featured carousel. */
  carouselIntro?: string;
  /** Slightly longer carousel body — only used when promoted. */
  carouselBody?: string;
  /** Full article body. Articles without `body` aren't routable. */
  body?: ArticleBody;
};

/**
 * Binds a set of article query helpers to a specific article list.
 * One blog (hive, learn, …) is one call to `createBlog`, keeping each
 * blog's content fully independent while sharing the same logic.
 */
export function createBlog(articles: Article[]) {
  return {
    all: articles,
    getBySlug: (slug: string): Article | undefined =>
      articles.find((a) => a.slug === slug),
    /** Articles flagged for the featured carousel. */
    getFeatured: (): Article[] =>
      articles.filter((a) => a.carouselIntro && a.carouselBody),
    /** Latest grid. Omit `limit` to get every article. */
    getLatest: (limit?: number): Article[] =>
      limit === undefined ? articles : articles.slice(0, limit),
    /** Related articles for the in-article footer (excludes current). */
    getRelated: (slug: string, limit = 2): Article[] =>
      articles.filter((a) => a.slug !== slug).slice(0, limit),
    /** Routable slugs — used by generateStaticParams. */
    getPublishedSlugs: (): string[] =>
      articles.filter((a) => a.body).map((a) => a.slug),
  };
}
