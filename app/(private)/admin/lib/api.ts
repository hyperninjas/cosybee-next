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

  // Status
  status: "DRAFT" | "PUBLISHED";
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
  /** List all posts (including drafts) for admin dashboard. */
  async listPosts(): Promise<AdminPostRow[]> {
    try {
      // Fetch from both blogs and combine
      const [hiveResponse, learnResponse] = await Promise.all([
        fetchApi<{ data: AdminPost[] }>(
          "/api/posts?blog=hive&include_drafts=true&limit=50",
        ),
        fetchApi<{ data: AdminPost[] }>(
          "/api/posts?blog=learn&include_drafts=true&limit=50",
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
};
