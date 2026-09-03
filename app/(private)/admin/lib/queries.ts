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
import { getAllArticles } from "@/app/lib/articles";
import type { LinkTarget } from "@/app/lib/link-targets";
import { adminApi, type AdminPost, type AdminPostRow } from "./api";

export type { AdminPostRow } from "./api";

/** All posts for the dashboard (drafts included), newest first. */
export async function listPosts(): Promise<AdminPostRow[]> {
  return adminApi.listPosts();
}

/**
 * Lay a post's unpublished edits over its live values.
 *
 * A live post's columns hold what readers already have; the staged patch holds
 * what the author has been writing. Everywhere inside the admin — the editor
 * and the preview both — the second is the one to show. Without it, reopening
 * a post would present the old version and the next autosave would overwrite
 * the staged work with it.
 *
 * `key in merged` rather than a `??` chain, so a field the author CLEARED
 * (staged as null) still wins over the live value instead of falling back to
 * it. Keys with no counterpart on the row — `authorId`, `categoryId` — are
 * skipped: those are references autosave doesn't stage.
 */
function applyStagedEdits(row: AdminPost): AdminPost {
  const staged = (row.draft ?? {}) as Record<string, unknown>;
  if (Object.keys(staged).length === 0) return row;
  const merged: Record<string, unknown> = { ...row };
  for (const key of Object.keys(staged)) {
    if (key in merged) merged[key] = staged[key];
  }
  return merged as unknown as AdminPost;
}

/** A single post for the edit form (full row), showing unpublished edits. */
export async function getPost(id: string): Promise<AdminPost | null> {
  const row = await adminApi.getPost(id);
  return row ? applyStagedEdits(row) : null;
}

/**
 * Map any post (draft or published) to the public Article shape.
 * Used by the admin draft-preview page.
 */
/**
 * Stand-ins for a draft that hasn't been attributed or filed yet.
 *
 * A post now exists from the moment its slug is chosen, so the preview has to
 * render one that may have no author and no category. These placeholders live
 * HERE, at the preview boundary, and are never written anywhere — which is the
 * whole difference between them and the "energiebee" / "Uncategorised" records
 * the editor used to save into the database to satisfy a NOT NULL column.
 *
 * The alternative — making `Article.author` nullable — would push a null check
 * into every public component that renders a byline, none of which can ever
 * receive one: the public site is served PUBLISHED posts only, and a post
 * cannot be published without both.
 */
const UNATTRIBUTED_AUTHOR: Author = {
  id: "",
  name: "No author yet",
  slug: "",
  avatarUrl: null,
  bio: null,
  role: null,
};

function unfiledCategory(blog: "hive" | "learn"): Category {
  return {
    id: "",
    blog,
    name: "No category yet",
    slug: "",
    description: null,
  };
}

export async function getPostArticle(id: string): Promise<Article | null> {
  const live = await adminApi.getPost(id);
  if (!live) return null;
  // A preview exists to answer "how will what I am writing look", so it shows
  // the staged version — previewing the article readers already have is the
  // one thing an author never needs.
  const row = applyStagedEdits(live);

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

    // Taxonomy (full objects). Placeholders only for an unfinished draft being
    // previewed — see above.
    author: row.author ?? UNATTRIBUTED_AUTHOR,
    category: row.category ?? unfiledCategory(row.blog),
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
    // No byline date chosen yet — show when the draft was created rather than
    // an empty date the formatter would render as "Invalid Date".
    authorDate: row.authorDate ?? row.createdAt,

    // Featured/Carousel
    featured: row.featured,
    homeFeatured: row.homeFeatured,
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
 * Everything on this site an author can link to: the canonical static pages
 * plus every PUBLISHED article, as titled, searchable entries.
 *
 * Published only, deliberately. A link to a draft is a link to a 404 until
 * someone remembers to publish it, and the article carrying the link may well
 * go live first — so an unpublished target is not a suggestion, it is a trap.
 *
 * A failure to reach the API degrades to the static pages rather than throwing:
 * the picker is an authoring convenience, and losing the article list for one
 * render is far better than an admin screen that won't open. (Contrast the
 * catalogue crawls in lib/articles.ts, where a short list would be published to
 * Google as though it were the truth.)
 */
export async function getLinkTargets(): Promise<LinkTarget[]> {
  const pages: LinkTarget[] = ROUTES.map((route) => ({
    kind: "page",
    title: route.label,
    path: route.path,
  }));

  try {
    // Same catalogue the sitemap is built from (lib/articles.ts), for three
    // reasons the admin listing couldn't give us:
    //
    //  1. It PAGINATES. `adminApi.listPosts` asks for a flat `limit=50` per
    //     blog and stops, so past 50 posts the picker would have quietly
    //     stopped offering older articles — a ceiling with no error.
    //  2. It reads the PUBLIC endpoint, which serves live posts only. That
    //     makes "published only" a property of the source rather than a filter
    //     we have to remember to apply.
    //  3. Its reads are cached and tagged (CONTENT_TAG), so they are shared
    //     with the public pages and refreshed by the same admin save.
    //
    // The sitemap XML itself is the wrong input despite listing every URL: it
    // carries no titles, so the picker could only ever show and search slugs.
    const [hive, learn] = await Promise.all([
      getAllArticles("hive"),
      getAllArticles("learn"),
    ]);
    const articles: LinkTarget[] = [...hive, ...learn].map((article) => ({
      kind: "post",
      title: article.title,
      path: `/${article.blog}/${article.slug}`,
      blog: article.blog,
    }));
    return [...pages, ...articles];
  } catch (e) {
    console.error("getLinkTargets: falling back to static pages only", e);
    return pages;
  }
}

/**
 * Paths only, for the CTA field's `<datalist>`. Derived from
 * `getLinkTargets` so the two pickers can never drift apart — this used to
 * return the static routes alone, despite promising articles too.
 */
export async function getInternalRoutes(): Promise<string[]> {
  return (await getLinkTargets()).map((target) => target.path);
}
