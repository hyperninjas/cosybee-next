import "server-only";

import { cookies } from "next/headers";
import type { Author, Category, Tag } from "@/app/lib/article-types";

const API_BASE = process.env.API_URL || "http://localhost:3000";

/** Post shape from the backend API. */
export interface AdminPost {
  id: string;
  blog: "hive" | "learn";
  slug: string;
  title: string;
  description: string;
  lede: string | null;
  seoTitle: string | null;
  seoDescription: string | null;

  // Taxonomy (full objects). Null while a post is a draft nobody has
  // attributed or filed yet — a post now exists from the moment its slug is
  // chosen. Publishing requires both, so anything a reader can reach has them.
  author: Author | null;
  category: Category | null;
  tags: Tag[];

  // Media — optional (a post can be saved without a cover).
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
  jsonLd?: Record<string, unknown> | null;

  // Display
  readTime: number;
  /** Null until the byline date is set — see `author`. */
  authorDate: string | null;

  // Featured/Carousel
  featured: boolean;
  homeFeatured: boolean;
  carouselIntro: string | null;
  carouselBody: string | null;

  // CTA
  ctaLabel: string | null;
  ctaHref: string | null;
  ctaExternal: boolean;

  // Status / scheduling
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt: string | null;

  // Content
  contentJson: Record<string, unknown> | null;
  contentHtml: string | null;

  /**
   * Edits saved but not yet made live, and when they were last touched.
   *
   * Only ever set on a PUBLISHED post: its columns ARE the live article, so
   * autosave stages here instead of overwriting them. A draft has nothing to
   * protect and autosaves straight into its own fields, leaving this null.
   */
  draft?: Partial<PostInput> | null;
  draftUpdatedAt?: string | null;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/** Row data for admin posts table. */
export type AdminPostRow = Pick<
  AdminPost,
  | "id"
  | "blog"
  | "slug"
  | "title"
  | "category"
  | "tags"
  | "status"
  | "featured"
  | "homeFeatured"
  | "coverImage"
  | "ogImage"
  | "updatedAt"
> & {
  /** The post is live and holding edits nobody has made live yet. */
  hasUnpublishedChanges?: boolean;
};

/** Input for creating/updating a post. */
export interface PostInput {
  blog: "hive" | "learn";
  slug: string;
  title: string;
  description: string;
  lede?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;

  // Taxonomy - use IDs or names (backend auto-creates if name provided)
  authorId?: string;
  authorName?: string;
  authorAvatarUrl?: string | null;
  categoryId?: string;
  category?: string; // category name for auto-create
  tags?: string[]; // tag names (backend auto-creates)

  // Media
  coverImage?: string;
  coverImageAlt?: string;
  coverImageTitle?: string | null;
  coverImageCaption?: string | null;
  coverImageCredit?: string | null;

  // SEO / social
  ogImage?: string | null;
  ogImageAlt?: string | null;
  canonicalUrl?: string | null;
  noindex?: boolean;

  // Display
  readTime?: number;
  authorDate?: string;

  // Featured/Carousel
  featured?: boolean;
  homeFeatured?: boolean;
  carouselIntro?: string | null;
  carouselBody?: string | null;

  // CTA
  ctaLabel?: string | null;
  ctaHref?: string | null;
  ctaExternal?: boolean;

  // Status / scheduling — set status: "PUBLISHED" with a future publishedAt
  // to schedule. Backend gates public visibility on publishedAt <= now.
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt?: string | null;

  // Content
  contentJson?: Record<string, unknown>;
  contentHtml?: string;
}

/** Make request to backend API with auth cookies forwarded. */
async function fetchApi<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${path}`;

  // Forward cookies from the incoming request for auth
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(cookieHeader && { Cookie: cookieHeader }),
    ...(options.headers as Record<string, string>),
  };

  console.log(`[adminApi] Fetching: ${url}`);
  // TEMP DIAGNOSTIC — remove after debugging the 400 "received undefined" save.
  console.log(
    `[adminApi:diag] method=${options.method ?? "GET"} ct=${headers["Content-Type"]} ` +
      `bodyType=${typeof options.body} ` +
      `bodyLen=${typeof options.body === "string" ? options.body.length : options.body == null ? 0 : "non-string"} ` +
      `bodyHead=${typeof options.body === "string" ? JSON.stringify(options.body.slice(0, 80)) : "n/a"}`,
  );

  const res = await fetch(url, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const error = await res.text();
    console.error(`[adminApi] Error ${res.status}: ${error}`);
    throw new Error(`API error ${res.status}: ${error}`);
  }

  // No-content responses (e.g. 204 from DELETE) have no body to parse —
  // calling res.json() on them throws "Unexpected end of JSON input".
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;

  const json = JSON.parse(text) as T;
  console.log(
    `[adminApi] Response from ${path}:`,
    JSON.stringify(json).slice(0, 200),
  );
  return json;
}

/** Make multipart request for file uploads. */
async function fetchApiMultipart<T>(
  path: string,
  formData: FormData,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    body: formData,
    cache: "no-store",
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API error ${res.status}: ${error}`);
  }

  return res.json();
}

export const adminApi = {
  /** List all posts (including drafts + archived) for admin dashboard.
   *  Uses the dedicated admin endpoint so the response carries
   *  every status, not just live posts. */
  async listPosts(): Promise<AdminPostRow[]> {
    try {
      // One call per blog so we can paginate independently if needed.
      const [hiveResponse, learnResponse] = await Promise.all([
        fetchApi<{ data: AdminPost[] }>("/api/admin/posts?blog=hive&limit=50"),
        fetchApi<{ data: AdminPost[] }>("/api/admin/posts?blog=learn&limit=50"),
      ]);
      const allPosts = [
        ...(hiveResponse.data || []),
        ...(learnResponse.data || []),
      ];
      // Sort by updatedAt descending
      allPosts.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
      return allPosts.map((p) => ({
        id: p.id,
        blog: p.blog,
        slug: p.slug,
        title: p.title,
        category: p.category,
        tags: p.tags ?? [],
        status: p.status,
        featured: p.featured,
        homeFeatured: p.homeFeatured,
        coverImage: p.coverImage,
        ogImage: p.ogImage ?? null,
        updatedAt: p.updatedAt,
      }));
    } catch (e) {
      console.error("listPosts error:", e);
      return [];
    }
  },

  /** Get a single post for editing by ID. */
  async getPost(id: string): Promise<AdminPost | null> {
    try {
      return await fetchApi<AdminPost>(`/api/posts/by-id/${id}`);
    } catch {
      return null;
    }
  },

  /** Create a new post. */
  async createPost(data: PostInput): Promise<AdminPost> {
    return fetchApi<AdminPost>("/api/posts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /** Update an existing post. */
  async updatePost(id: string, data: Partial<PostInput>): Promise<AdminPost> {
    return fetchApi<AdminPost>(`/api/posts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  /**
   * Autosave. The backend decides where it lands — straight into a draft's
   * own columns, or staged aside on a published post — so callers don't have
   * to know. Never changes publication: `status` is rejected here, not
   * ignored.
   */
  async stageDraft(id: string, data: Partial<PostInput>): Promise<AdminPost> {
    return fetchApi<AdminPost>(`/api/posts/${id}/draft`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  /** Throw the staged edits away; the live article is untouched. */
  async discardDraft(id: string): Promise<AdminPost> {
    return fetchApi<AdminPost>(`/api/posts/${id}/draft`, { method: "DELETE" });
  },

  /** Delete a post. */
  async deletePost(id: string): Promise<void> {
    await fetchApi(`/api/posts/${id}`, { method: "DELETE" });
  },

  /** Update post status (draft / publish / archive). */
  async setStatus(
    id: string,
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED",
  ): Promise<AdminPost> {
    return fetchApi<AdminPost>(`/api/posts/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  /** Upload media file. Returns the media URL. */
  async uploadMedia(file: File): Promise<{ id: string; url: string }> {
    const formData = new FormData();
    formData.append("file", file);
    const result = await fetchApiMultipart<{ id: string }>(
      "/api/media",
      formData,
    );
    return {
      id: result.id,
      url: `${API_BASE}/api/media/${result.id}`,
    };
  },

  /** Get all categories (full objects). */
  async getAllCategories(): Promise<Category[]> {
    try {
      const [hive, learn] = await Promise.all([
        fetchApi<{ data: Category[] }>("/api/posts/categories?blog=hive"),
        fetchApi<{ data: Category[] }>("/api/posts/categories?blog=learn"),
      ]);
      return [...(hive.data || []), ...(learn.data || [])];
    } catch (e) {
      console.error("getAllCategories error:", e);
      return [];
    }
  },

  /** Get categories for a specific blog. */
  async getCategories(blog: "hive" | "learn"): Promise<Category[]> {
    try {
      const response = await fetchApi<{ data: Category[] }>(
        `/api/posts/categories?blog=${blog}`,
      );
      return response.data;
    } catch {
      return [];
    }
  },

  /** Get every tag in the DB.
   *
   *  Note: `/api/posts/tags?blog=X` returns only tags *already used by a
   *  post in that blog*, per the endpoint's "List tags (optionally used
   *  within a blog)" contract. Omit the `blog` param to get every tag —
   *  including newly created ones not yet attached to any post — which
   *  is what the post-editor's TagInput autocomplete needs. */
  async getAllTags(): Promise<Tag[]> {
    try {
      const response = await fetchApi<{ data: Tag[] }>("/api/posts/tags");
      return response.data || [];
    } catch (e) {
      console.error("getAllTags error:", e);
      return [];
    }
  },

  /** Get tags for a specific blog. */
  async getTags(blog: "hive" | "learn"): Promise<Tag[]> {
    try {
      const response = await fetchApi<{ data: Tag[] }>(
        `/api/posts/tags?blog=${blog}`,
      );
      return response.data;
    } catch {
      return [];
    }
  },

  /** Get all authors. */
  async getAuthors(): Promise<Author[]> {
    try {
      const response = await fetchApi<{ data: Author[] }>("/api/posts/authors");
      return response.data || [];
    } catch (e) {
      console.error("getAuthors error:", e);
      return [];
    }
  },

  /**
   * The post occupying `slug` in `blog`, or null when the slug is free.
   *
   * Goes through the ADMIN listing, which carries every status. The previous
   * version asked the public `/api/posts/:blog/:slug`, and that route serves
   * live posts only — it 404s for drafts, archived and future-scheduled posts
   * for everyone, admins included. A slug already held by a draft therefore
   * read as free, the save kept it, and Postgres rejected it on the
   * `(blog, slug)` unique index as an opaque failure. Two drafts with similar
   * titles is the likeliest way to collide at all, so that was the common
   * path, not an edge case.
   *
   * `excludeId` is the post being edited: a post never conflicts with itself.
   */
  async findPostBySlug(
    blog: string,
    slug: string,
    excludeId?: string,
  ): Promise<{ id: string; title: string; status: string } | null> {
    const wanted = slug.trim().toLowerCase();
    if (!wanted) return null;
    try {
      // The admin list has no slug filter, so walk pages. `limit` is capped at
      // 100 upstream; the page cap keeps a runaway catalogue from spinning here.
      const PER_PAGE = 100;
      const MAX_PAGES = 20;
      for (let page = 1; page <= MAX_PAGES; page++) {
        const res = await fetchApi<{
          data: AdminPost[];
          pagination?: { totalPages?: number };
        }>(`/api/admin/posts?blog=${blog}&page=${page}&limit=${PER_PAGE}`);
        const rows = res.data ?? [];
        const hit = rows.find((p) => p.slug?.toLowerCase() === wanted);
        if (hit) {
          if (excludeId && hit.id === excludeId) return null;
          return { id: hit.id, title: hit.title, status: hit.status };
        }
        const totalPages = res.pagination?.totalPages ?? 1;
        if (rows.length === 0 || page >= totalPages) break;
      }
      return null;
    } catch (e) {
      // Deliberately rethrown-as-null is NOT safe here: callers treat null as
      // "free to use". Surface it so the caller can decide.
      console.error("findPostBySlug error:", e);
      throw e;
    }
  },

  // ---------------------------------------------------------------
  // Authors CRUD
  // ---------------------------------------------------------------

  async createAuthor(input: AuthorInput): Promise<Author> {
    return fetchApi<Author>("/api/admin/posts/authors", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async updateAuthor(id: string, input: Partial<AuthorInput>): Promise<Author> {
    return fetchApi<Author>(`/api/admin/posts/authors/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  async deleteAuthor(id: string): Promise<void> {
    await fetchApi(`/api/admin/posts/authors/${id}`, { method: "DELETE" });
  },

  // ---------------------------------------------------------------
  // Categories CRUD
  // ---------------------------------------------------------------

  async createCategory(input: CategoryInput): Promise<Category> {
    return fetchApi<Category>("/api/admin/posts/categories", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async updateCategory(
    id: string,
    input: Partial<CategoryInput>,
  ): Promise<Category> {
    return fetchApi<Category>(`/api/admin/posts/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  async deleteCategory(id: string): Promise<void> {
    await fetchApi(`/api/admin/posts/categories/${id}`, { method: "DELETE" });
  },

  // ---------------------------------------------------------------
  // Tags CRUD
  // ---------------------------------------------------------------

  async createTag(input: TagInput): Promise<Tag> {
    return fetchApi<Tag>("/api/admin/posts/tags", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async updateTag(id: string, input: Partial<TagInput>): Promise<Tag> {
    return fetchApi<Tag>(`/api/admin/posts/tags/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  async deleteTag(id: string): Promise<void> {
    await fetchApi(`/api/admin/posts/tags/${id}`, { method: "DELETE" });
  },

  // ---------------------------------------------------------------
  // Phrase of the Week (footer rotation)
  // ---------------------------------------------------------------

  /** Every phrase, active or not, in rotation order. */
  async listPhrases(): Promise<AdminPhrase[]> {
    try {
      const res = await fetchApi<{ data: AdminPhrase[] }>("/api/admin/phrases");
      return res.data ?? [];
    } catch (e) {
      console.error("listPhrases error:", e);
      return [];
    }
  },

  async createPhrase(input: PhraseInput): Promise<AdminPhrase> {
    return fetchApi<AdminPhrase>("/api/admin/phrases", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async updatePhrase(
    id: string,
    input: Partial<PhraseInput>,
  ): Promise<AdminPhrase> {
    return fetchApi<AdminPhrase>(`/api/admin/phrases/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  async deletePhrase(id: string): Promise<void> {
    await fetchApi(`/api/admin/phrases/${id}`, { method: "DELETE" });
  },

  /** Apply a whole ordering at once. See the backend's reorder endpoint. */
  async reorderPhrases(ids: string[]): Promise<AdminPhrase[]> {
    const res = await fetchApi<{ data: AdminPhrase[] }>(
      "/api/admin/phrases/reorder",
      { method: "PATCH", body: JSON.stringify({ ids }) },
    );
    return res.data ?? [];
  },
};

// ---------------------------------------------------------------
// Input shapes for the new CRUD endpoints. Required fields only — the
// backend fills in slug, timestamps, and any derived columns.
// ---------------------------------------------------------------

export interface AuthorInput {
  name: string;
  slug?: string;
  avatarUrl?: string | null;
  avatarAlt?: string | null;
  avatarWidth?: number | null;
  avatarHeight?: number | null;
  bio?: string | null;
  role?: string | null;
  email?: string | null;
  website?: string | null;
  twitter?: string | null;
  linkedin?: string | null;
  github?: string | null;
}

export interface CategoryInput {
  blog: "hive" | "learn";
  name: string;
  slug?: string;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  iconUrl?: string | null;
  color?: string | null;
}

export interface TagInput {
  name: string;
  /** Keep the existing slug stable on rename unless explicitly set. */
  slug?: string;
  description?: string | null;
}

/**
 * One entry of the footer's "Phrase of the Week" rotation
 * (eb-auth `src/modules/phrases`).
 */
export interface AdminPhrase {
  id: string;
  quote: string;
  author: string;
  /** Site-relative path of the paired page, e.g. "/hive/why-a-bee". */
  articlePath: string;
  /** Title of that page when it was picked — admin display only. */
  articleLabel: string | null;
  /** 0-based slot in the rotation. */
  position: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PhraseInput {
  quote: string;
  author: string;
  articlePath: string;
  articleLabel?: string | null;
  isActive?: boolean;
}
