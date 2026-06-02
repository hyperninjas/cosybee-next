import "server-only";

const API_BASE = process.env.API_URL || "http://localhost:3000";

export type Blog = "hive" | "learn";

/** Post shape returned by the backend API. */
export interface ApiPost {
  id: string;
  blog: string;
  slug: string;
  title: string;
  description: string;
  lede: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  category: string;
  tags: string[];
  /** Minutes (integer) — format as "N min read" on display. */
  readTime: number;
  coverImage: string;
  coverImageAlt: string;
  ctaLabel: string | null;
  ctaHref: string | null;
  ctaExternal: boolean;
  authorName: string;
  /** ISO date string from backend DateTime. */
  authorDate: string;
  carouselIntro: string | null;
  carouselBody: string | null;
  featured: boolean;
  status: string;
  publishedAt: string | null;
  contentJson?: Record<string, unknown>;
  contentHtml?: string;
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

async function fetchJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      next: { revalidate: 60 }, // Cache for 60 seconds
    });
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

async function fetchJsonOrNull<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
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

  /** Featured posts for carousel. */
  async getFeatured(blog: Blog): Promise<DataResponse<ApiPost[]>> {
    return fetchJson(`/api/posts/featured?blog=${blog}`, { data: [] });
  },

  /** Distinct categories for filter bar. */
  async getCategories(blog: Blog): Promise<DataResponse<string[]>> {
    return fetchJson(`/api/posts/categories?blog=${blog}`, { data: [] });
  },

  /** Single article by slug (includes contentHtml). */
  async getPost(blog: Blog, slug: string): Promise<ApiPost | null> {
    return fetchJsonOrNull(`/api/posts/${blog}/${slug}`);
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
