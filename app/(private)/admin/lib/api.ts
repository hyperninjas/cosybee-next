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
  authorDate: string;

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
  // Tariff catalog (read: public /api/tariffs, write: /api/admin/tariffs)
  // ---------------------------------------------------------------

  /** Search/list tariffs. Each item carries provider + region rates. */
  async listTariffs(
    params: {
      q?: string;
      providerId?: string;
      type?: string;
      fuel?: string;
      regionId?: number;
      limit?: number;
    } = {},
  ): Promise<TariffDTO[]> {
    const qs = new URLSearchParams();
    if (params.q) qs.set("q", params.q);
    if (params.providerId) qs.set("providerId", params.providerId);
    if (params.type) qs.set("type", params.type);
    if (params.fuel) qs.set("fuel", params.fuel);
    if (params.regionId != null) qs.set("regionId", String(params.regionId));
    qs.set("limit", String(params.limit ?? 50));
    try {
      const res = await fetchApi<{ data: TariffDTO[] }>(
        `/api/tariffs?${qs.toString()}`,
      );
      return res.data ?? [];
    } catch (e) {
      console.error("listTariffs error:", e);
      return [];
    }
  },

  async getTariff(id: string): Promise<TariffDTO | null> {
    try {
      return await fetchApi<TariffDTO>(`/api/tariffs/${id}`);
    } catch {
      return null;
    }
  },

  async getTariffProviders(): Promise<TariffProviderDTO[]> {
    try {
      return await fetchApi<TariffProviderDTO[]>("/api/tariffs/providers");
    } catch (e) {
      console.error("getTariffProviders error:", e);
      return [];
    }
  },

  async getTariffRegions(): Promise<TariffRegionDTO[]> {
    try {
      return await fetchApi<TariffRegionDTO[]>("/api/tariffs/regions");
    } catch (e) {
      console.error("getTariffRegions error:", e);
      return [];
    }
  },

  async createTariff(input: CreateTariffInput): Promise<TariffDTO> {
    return fetchApi<TariffDTO>("/api/admin/tariffs", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async updateTariff(id: string, input: UpdateTariffInput): Promise<TariffDTO> {
    return fetchApi<TariffDTO>(`/api/admin/tariffs/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  async deleteTariff(id: string): Promise<void> {
    await fetchApi(`/api/admin/tariffs/${id}`, { method: "DELETE" });
  },

  async updateProvider(
    id: string,
    input: UpdateProviderInput,
  ): Promise<TariffProviderDTO> {
    return fetchApi<TariffProviderDTO>(`/api/admin/tariffs/providers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
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

// ---------------------------------------------------------------
// Tariff catalog shapes — mirror the eb-auth tariffs module DTOs.
// All rate values are pence (p/kWh unit rates, p/day standing charges).
// ---------------------------------------------------------------

export const TARIFF_TYPES = [
  "fixed",
  "variable",
  "tracker",
  "agile",
  "economy_7",
  "time_of_use",
  "ev",
  "heat_pump",
  "export",
] as const;
export type TariffType = (typeof TARIFF_TYPES)[number];

export const TARIFF_PAYMENTS = ["direct_debit", "on_receipt"] as const;
export type TariffPayment = (typeof TARIFF_PAYMENTS)[number];

export const TARIFF_FUELS = ["dual_fuel", "electricity_only"] as const;
export type TariffFuel = (typeof TARIFF_FUELS)[number];

export interface TariffRegionRateDTO {
  regionId: number;
  region: string;
  sourceName: string;
  electricity?: { unitRate?: number; standingCharge?: number };
  economy7?: { dayRate?: number; nightRate?: number; standingCharge?: number };
  timeOfUse?: { peakRate?: number; offPeakRate?: number };
  gas?: { unitRate?: number; standingCharge?: number };
}

export interface TariffProviderRefDTO {
  id: string;
  name: string;
  slug: string;
  status: "active" | "acquired";
  isPopular: boolean;
  acquiredBy?: string;
}

export interface TariffDTO {
  id: string;
  name: string;
  type: TariffType;
  payment: TariffPayment;
  fuel?: TariffFuel;
  term?: string;
  effectiveDate?: string;
  exitFee?: string;
  offPeakHours?: string;
  note?: string;
  smartMeterRequired: boolean;
  provider: TariffProviderRefDTO;
  regions: TariffRegionRateDTO[];
}

export interface TariffProviderDTO {
  id: string;
  name: string;
  slug: string;
  status: "active" | "acquired";
  isPopular: boolean;
  acquiredBy?: string;
  note?: string;
  tariffCount: number;
}

/** Editable provider fields (PATCH /api/admin/tariffs/providers/:id). */
export interface UpdateProviderInput {
  name?: string;
  isActive?: boolean;
  isPopular?: boolean;
  acquiredBy?: string | null;
  note?: string | null;
}

export interface TariffRegionDTO {
  id: number;
  name: string;
}

/** Flat per-region rate row, as edited in the table and sent to the backend. */
export interface TariffRegionRateInput {
  regionId: number;
  sourceName?: string;
  elecUnit?: number | null;
  elecStanding?: number | null;
  e7Day?: number | null;
  e7Night?: number | null;
  e7Standing?: number | null;
  peakUnit?: number | null;
  offPeakUnit?: number | null;
  gasUnit?: number | null;
  gasStanding?: number | null;
}

export interface CreateTariffInput {
  /** Existing provider id; omit and pass `providerName` to create a new one. */
  providerId?: string;
  /** New provider to find-or-create by name (used when `providerId` is absent). */
  providerName?: string;
  name: string;
  type: TariffType;
  payment: TariffPayment;
  fuel?: TariffFuel | null;
  term?: string | null;
  effectiveDate?: string | null;
  exitFee?: string | null;
  offPeakHours?: string | null;
  note?: string | null;
  smartMeterRequired?: boolean;
  regions?: TariffRegionRateInput[];
}

export type UpdateTariffInput = Partial<Omit<CreateTariffInput, "providerId">>;
