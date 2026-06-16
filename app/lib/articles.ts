import "server-only";
import { api, type ApiPost, type Blog } from "./api";
import {
  resolveCoverImage,
  type Article,
  type Author,
  type Category,
  type Tag,
} from "./article-types";

export type { Article, Author, Category, Tag } from "./article-types";
export { formatReadTime } from "./article-types";
export type { Blog } from "./api";

/** Normalize category - handles both old (string) and new (object) formats. */
function normalizeCategory(
  category: string | Category | undefined,
  blog: "hive" | "learn",
): Category {
  if (!category) {
    return {
      id: "",
      blog,
      name: "Uncategorised",
      slug: "uncategorised",
      description: null,
    };
  }
  if (typeof category === "string") {
    // Old format: category is just a string name
    return {
      id: "",
      blog,
      name: category,
      slug: category.toLowerCase().replace(/\s+/g, "-"),
      description: null,
    };
  }
  // New format: already a Category object
  return category;
}

/** Normalize tags - handles both old (string[]) and new (Tag[]) formats. */
function normalizeTags(tags: (string | Tag)[] | undefined): Tag[] {
  if (!tags || tags.length === 0) return [];
  return tags.map((t) => {
    if (typeof t === "string") {
      // Old format: tag is just a string
      return {
        id: "",
        name: t,
        slug: t.toLowerCase().replace(/\s+/g, "-"),
      };
    }
    // New format: already a Tag object
    return t;
  });
}

/** Normalize author - handles both old (authorName string) and new (object) formats. */
function normalizeAuthor(
  author: Author | undefined,
  authorName: string | undefined,
): Author {
  if (author && typeof author === "object" && author.name) {
    return author;
  }
  // Old format: use authorName field
  const name = authorName ?? "energiebee";
  return {
    id: "",
    name,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
    avatarUrl: null,
    bio: null,
    role: null,
  };
}

/** Transform API post to frontend Article shape. */
function toArticle(post: ApiPost): Article {
  return {
    id: post.id,
    blog: post.blog,
    slug: post.slug,
    title: post.title,
    description: post.description ?? "",
    lede: post.lede,

    // SEO
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,

    // Taxonomy (normalized from backend - handles both old and new formats)
    author: normalizeAuthor(post.author, post.authorName),
    category: normalizeCategory(post.category, post.blog),
    tags: normalizeTags(post.tags),

    // Media
    coverImage: resolveCoverImage(post.coverImage, post.ogImage),
    coverImageAlt: post.coverImageAlt ?? "",
    coverImageTitle: post.coverImageTitle ?? null,
    coverImageCaption: post.coverImageCaption ?? null,
    coverImageCredit: post.coverImageCredit ?? null,

    // SEO / social
    ogImage: post.ogImage ?? null,
    ogImageAlt: post.ogImageAlt ?? null,
    canonicalUrl: post.canonicalUrl ?? null,
    noindex: post.noindex ?? false,
    jsonLd: post.jsonLd ?? null,

    // Display
    readTime: post.readTime ?? 1,
    authorDate: post.authorDate ?? "",

    // Featured/Carousel
    featured: post.featured ?? false,
    carouselIntro: post.carouselIntro,
    carouselBody: post.carouselBody,

    // CTA (flattened)
    ctaLabel: post.ctaLabel,
    ctaHref: post.ctaHref,
    ctaExternal: post.ctaExternal ?? false,

    // Status
    status: post.status ?? "DRAFT",
    publishedAt: post.publishedAt,

    // Content
    contentJson: post.contentJson ?? null,
    contentHtml: post.contentHtml ?? null,

    // Timestamps
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
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

/** Distinct categories for a blog's filter bar (full Category objects). */
export async function getCategories(blog: Blog): Promise<Category[]> {
  const response = await api.getCategories(blog);
  return response.data;
}

/** Category names for a blog's filter bar, prefixed with "All". */
export async function getCategoryNames(blog: Blog): Promise<string[]> {
  const response = await api.getCategories(blog);
  return ["All", ...response.data.map((c) => c.name)];
}

/** All tags for a blog. */
export async function getTags(blog: Blog): Promise<Tag[]> {
  const response = await api.getTags(blog);
  return response.data;
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

/** Does an author object carry any profile detail worth a page header? */
function hasAuthorDetail(a: Author): boolean {
  return Boolean(a.bio || a.avatarUrl || a.role);
}

/** Unique author slugs across both blogs — for author-page static params + sitemap. */
export async function getAuthorSlugs(): Promise<string[]> {
  const [hive, learn] = await Promise.all([
    getAllArticles("hive"),
    getAllArticles("learn"),
  ]);
  const slugs = new Set<string>();
  for (const a of [...hive, ...learn]) {
    if (a.author?.slug) slugs.add(a.author.slug);
  }
  return [...slugs];
}

/**
 * An author's profile + their published articles (newest first, both blogs).
 * Returns null if the slug matches no author. Picks the richest author object
 * seen (one with a bio/avatar/role) so the header isn't empty when only some
 * posts carry full author detail.
 */
export async function getAuthorProfile(
  slug: string,
): Promise<{ author: Author; articles: Article[] } | null> {
  const [hive, learn] = await Promise.all([
    getAllArticles("hive"),
    getAllArticles("learn"),
  ]);
  const mine = [...hive, ...learn].filter((a) => a.author?.slug === slug);
  if (mine.length === 0) return null;

  const author = mine
    .map((a) => a.author)
    .reduce((best, cur) =>
      hasAuthorDetail(cur) && !hasAuthorDetail(best) ? cur : best,
    );

  const articles = mine.sort(
    (a, b) =>
      new Date(b.publishedAt ?? b.authorDate ?? 0).getTime() -
      new Date(a.publishedAt ?? a.authorDate ?? 0).getTime(),
  );
  return { author, articles };
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

/** Unique tag slugs used by a blog's published articles (for tag pages). */
export async function getTagSlugs(blog: Blog): Promise<string[]> {
  const posts = await getAllPublishedPosts(blog);
  const slugs = new Set<string>();
  for (const p of posts) {
    for (const t of p.tags ?? []) {
      // Handle both old (string) and new (Tag object) formats
      const slug =
        typeof t === "string" ? t.toLowerCase().replace(/\s+/g, "-") : t.slug;
      if (slug) slugs.add(slug);
    }
  }
  return [...slugs];
}
