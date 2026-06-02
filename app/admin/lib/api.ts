import "server-only";

const API_BASE = process.env.API_URL || "http://localhost:3000";

/** Post shape from the backend API. */
export interface AdminPost {
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
  readTime: number;
  coverImage: string;
  coverImageAlt: string;
  ctaLabel: string | null;
  ctaHref: string | null;
  ctaExternal: boolean;
  authorName: string;
  authorDate: string;
  carouselIntro: string | null;
  carouselBody: string | null;
  featured: boolean;
  status: string;
  publishedAt: string | null;
  contentJson: object | string;
  contentHtml: string;
  createdAt: string;
  updatedAt: string;
}

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

/** Make request to backend API (no auth required for now). */
async function fetchApi<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API error ${res.status}: ${error}`);
  }

  return res.json();
}

/** Make multipart request for file uploads (no auth required for now). */
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
  async createPost(data: Partial<AdminPost>): Promise<AdminPost> {
    return fetchApi<AdminPost>("/api/posts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /** Update an existing post. */
  async updatePost(id: string, data: Partial<AdminPost>): Promise<AdminPost> {
    return fetchApi<AdminPost>(`/api/posts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  /** Delete a post. */
  async deletePost(id: string): Promise<void> {
    await fetchApi(`/api/posts/${id}`, { method: "DELETE" });
  },

  /** Update post status (publish/unpublish). */
  async setStatus(id: string, status: string): Promise<AdminPost> {
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
    // Construct URL from returned ID
    return {
      id: result.id,
      url: `${API_BASE}/api/media/${result.id}`,
    };
  },

  /** Get all categories across posts. */
  async getAllCategories(): Promise<string[]> {
    try {
      const hive = await fetchApi<{ data: string[] }>(
        "/api/posts/categories?blog=hive",
      );
      const learn = await fetchApi<{ data: string[] }>(
        "/api/posts/categories?blog=learn",
      );
      return [...new Set([...hive.data, ...learn.data])].sort();
    } catch {
      return [];
    }
  },

  /** Get all tags across posts. */
  async getAllTags(): Promise<string[]> {
    // Backend might not have a tags endpoint, return empty for now
    return [];
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
