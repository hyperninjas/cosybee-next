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

  // Taxonomy (full objects)
  author: Author;
  category: Category;
  tags: Tag[];

  // Media
  coverImage: string;
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
  authorDate: string;

  // Featured/Carousel
  featured: boolean;
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
  | "status"
  | "featured"
  | "coverImage"
  | "updatedAt"
>;

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
  const cookieHeader = cookieStore.getAll()
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

  const json = await res.json();
  console.log(`[adminApi] Response from ${path}:`, JSON.stringify(json).slice(0, 200));
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
        fetchApi<{ data: AdminPost[] }>(
          "/api/admin/posts?blog=hive&limit=50",
        ),
        fetchApi<{ data: AdminPost[] }>(
          "/api/admin/posts?blog=learn&limit=50",
        ),
      ]);
      const allPosts = [
        ...(hiveResponse.data || []),
        ...(learnResponse.data || []),
      ];
      // Sort by updatedAt descending
      allPosts.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      return allPosts.map((p) => ({
        id: p.id,
        blog: p.blog,
        slug: p.slug,
        title: p.title,
        category: p.category,
        status: p.status,
        featured: p.featured,
        coverImage: p.coverImage,
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

  /** Get all tags (full objects). */
  async getAllTags(): Promise<Tag[]> {
    try {
      const [hive, learn] = await Promise.all([
        fetchApi<{ data: Tag[] }>("/api/posts/tags?blog=hive"),
        fetchApi<{ data: Tag[] }>("/api/posts/tags?blog=learn"),
      ]);
      // Dedupe by id
      const tagMap = new Map<string, Tag>();
      [...(hive.data || []), ...(learn.data || [])].forEach((t) => tagMap.set(t.id, t));
      return Array.from(tagMap.values());
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

  /** Check if slug exists (for uniqueness). */
  async checkSlugExists(
    blog: string,
    slug: string,
    excludeId?: string,
  ): Promise<boolean> {
    try {
      const post = await fetchApi<AdminPost | null>(
        `/api/posts/${blog}/${slug}`,
      );
      if (!post) return false;
      if (excludeId && post.id === excludeId) return false;
      return true;
    } catch {
      return false;
    }
  },

  // ---------------------------------------------------------------
  // Authors CRUD
  // ---------------------------------------------------------------

  async getAuthor(id: string): Promise<Author | null> {
    try {
      return await fetchApi<Author>(`/api/admin/posts/authors/${id}`);
    } catch {
      return null;
    }
  },

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

  async getCategory(id: string): Promise<Category | null> {
    try {
      return await fetchApi<Category>(`/api/admin/posts/categories/${id}`);
    } catch {
      return null;
    }
  },

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

  async getTag(id: string): Promise<Tag | null> {
    try {
      return await fetchApi<Tag>(`/api/admin/posts/tags/${id}`);
    } catch {
      return null;
    }
  },

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
