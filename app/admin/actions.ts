"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { slugify, normalizeTag } from "@/app/lib/slug";
import { excerptFromJson } from "@/app/lib/read-time";
import { contentJsonToHtml } from "@/app/lib/blocknote";
import { adminApi } from "./lib/api";
import type { SaveState } from "./lib/form-state";
import { assertAdmin } from "./lib/auth";

const BLOGS = new Set(["hive", "learn"]);
const STATUSES = new Set(["DRAFT", "PUBLISHED"]);
const MAX_TAGS = 8;

function str(form: FormData, key: string): string {
  return (form.get(key) as string | null)?.trim() ?? "";
}

function optStr(form: FormData, key: string): string | null {
  const v = str(form, key);
  return v === "" ? null : v;
}

/** Parse + clean the JSON tag list submitted by the chip input. */
function parseTags(form: FormData): string[] {
  const raw = str(form, "tags");
  let arr: unknown = [];
  try {
    arr = JSON.parse(raw || "[]");
  } catch {
    arr = [];
  }
  if (!Array.isArray(arr)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of arr) {
    if (typeof t !== "string") continue;
    const tag = normalizeTag(t);
    const key = tag.toLowerCase();
    if (tag && !seen.has(key)) {
      seen.add(key);
      out.push(tag);
    }
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}

/**
 * Upload an image to the backend and return its URL.
 */
async function uploadToBackend(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;
  try {
    const result = await adminApi.uploadMedia(file);
    return result.url;
  } catch (e) {
    console.error("Upload failed:", e);
    return null;
  }
}

/**
 * Upload a single image (used by the in-editor image block) and return
 * its public URL. Invoked from the client editor's `uploadFile` hook.
 */
export async function uploadImage(formData: FormData): Promise<string> {
  await assertAdmin();
  const file = formData.get("file") as File | null;
  const url = await uploadToBackend(file);
  if (!url) throw new Error("Upload failed");
  return url;
}

/** Find a slug unique within a blog, appending -2, -3, … on collision. */
async function uniqueSlug(
  blog: string,
  base: string,
  excludeId?: string | null,
): Promise<string> {
  let slug = base;
  let n = 2;
  while (await adminApi.checkSlugExists(blog, slug, excludeId ?? undefined)) {
    slug = `${base}-${n++}`;
    if (n > 100) break; // Safety limit
  }
  return slug;
}

/**
 * Create or update a post. Returns a {@link SaveState} with inline
 * field errors on validation failure; on success it redirects to dashboard.
 */
export async function savePost(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  await assertAdmin();

  const id = optStr(formData, "id");
  const rawBlog = str(formData, "blog");
  const blog = BLOGS.has(rawBlog) ? (rawBlog as "hive" | "learn") : "hive";
  const rawStatus = str(formData, "status");
  const status = STATUSES.has(rawStatus) ? (rawStatus as "DRAFT" | "PUBLISHED") : "DRAFT";
  const title = str(formData, "title");
  const contentJsonStr = str(formData, "contentJson") || "[]";

  // Parse contentJson as object and generate HTML
  // Backend expects { blocks: [...] } format, not raw array
  let blocks: unknown[];
  try {
    blocks = JSON.parse(contentJsonStr);
  } catch {
    blocks = [];
  }
  if (!Array.isArray(blocks)) blocks = [];

  // Backend expects { blocks: [...] } format for contentJson
  // If blocks are empty, don't send content - this preserves legacy content on metadata-only edits
  const hasContent = blocks.length > 0;
  const contentJson = hasContent ? { blocks } : undefined;
  const contentHtml = hasContent ? await contentJsonToHtml(blocks) : undefined;

  if (!hasContent && id) {
    console.log("[savePost] No editor content - preserving original post content");
  }

  // Cover: upload new file or keep existing
  const uploaded = await uploadToBackend(formData.get("coverFile") as File | null);
  const coverImage = uploaded ?? (str(formData, "coverImage") || "/bee-flower.png");

  // Validation
  const fieldErrors: Record<string, string> = {};
  if (!title) fieldErrors.title = "Add a title before saving.";

  const base = slugify(str(formData, "slug") || title);
  if (title && !base) fieldErrors.slug = "Could not derive a slug from the title.";

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: "Add a title to save your post.", fieldErrors };
  }

  // Derived values
  const slug = await uniqueSlug(blog, base, id);
  const readTimeMinutes = parseInt(str(formData, "readTime")) ||
    Math.max(1, Math.round(countWordsFromJson(contentJsonStr) / 200));
  const description = str(formData, "description") || excerptFromJson(contentJsonStr) || title || "No description";
  const tags = parseTags(formData);
  const featured = formData.get("featured") === "on";

  // CTA handling
  const ctaLabel = optStr(formData, "ctaLabel");
  const ctaExternal = formData.get("ctaExternal") === "on";
  let ctaHref = optStr(formData, "ctaHref");
  if (ctaHref) {
    if (ctaExternal) {
      if (!/^(https?:\/\/|mailto:|tel:)/i.test(ctaHref)) {
        ctaHref = `https://${ctaHref}`;
      }
    } else if (!ctaHref.startsWith("/")) {
      ctaHref = `/${ctaHref}`;
    }
  }

  // Carousel fields
  const lede = optStr(formData, "lede");
  const carouselIntro = optStr(formData, "carouselIntro") ?? (featured ? lede ?? description : null);
  const carouselBody = optStr(formData, "carouselBody") ?? (featured ? description : null);

  // Author handling - use authorId if provided, otherwise authorName for auto-create
  const authorId = optStr(formData, "authorId");
  const authorName = str(formData, "authorName") || "energiebee";
  const authorAvatarUrl = optStr(formData, "authorAvatarUrl");

  // Category handling - use categoryId if provided, otherwise category name for auto-create
  const categoryId = optStr(formData, "categoryId");
  const category = str(formData, "category") || "Uncategorised";

  const data = {
    blog,
    slug,
    title,
    seoTitle: optStr(formData, "seoTitle"),
    seoDescription: optStr(formData, "seoDescription"),
    description,
    // Taxonomy - send ID if available, otherwise name + avatar for auto-create
    ...(authorId ? { authorId } : { authorName, authorAvatarUrl }),
    ...(categoryId ? { categoryId } : { category }),
    tags, // string[] of tag names (backend auto-creates)
    readTime: readTimeMinutes,
    coverImage,
    coverImageAlt: str(formData, "coverImageAlt") || title,
    lede,
    ctaLabel,
    ctaHref,
    ctaExternal: ctaHref ? ctaExternal : false,
    // Backend expects "YYYY-MM-DD" format for authorDate
    authorDate: (() => {
      const dateStr = str(formData, "authorDate");
      console.log("[savePost] authorDate from form:", dateStr);
      if (!dateStr) {
        // Default to today in YYYY-MM-DD format
        const today = new Date().toISOString().split("T")[0];
        console.log("[savePost] No date provided, defaulting to today:", today);
        return today;
      }
      // Validate it's a valid date, return as-is if valid YYYY-MM-DD
      const parsed = new Date(dateStr);
      if (isNaN(parsed.getTime())) {
        const today = new Date().toISOString().split("T")[0];
        console.log("[savePost] Invalid date, defaulting to today:", today);
        return today;
      }
      console.log("[savePost] authorDate valid:", dateStr);
      return dateStr; // Already YYYY-MM-DD from date input
    })(),
    carouselIntro,
    carouselBody,
    featured,
    status,
    // Only include content if editor has blocks - preserves legacy content on metadata-only edits
    ...(contentJson !== undefined && { contentJson }),
    ...(contentHtml !== undefined && { contentHtml }),
  };

  try {
    if (id) {
      await adminApi.updatePost(id, data);
    } else {
      await adminApi.createPost(data);
    }
  } catch (e) {
    return { ok: false, error: `Could not save: ${(e as Error).message}` };
  }

  revalidatePath("/admin");
  revalidatePath(`/${blog}`);
  revalidatePath(`/${blog}/${slug}`);
  redirect(`/admin?saved=${blog}/${slug}&status=${status}`);
}

/** Flip a post between DRAFT and PUBLISHED from the dashboard. */
export async function setStatus(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = str(formData, "id");
  const blog = str(formData, "blog");
  const slug = str(formData, "slug");
  const rawStatus = str(formData, "status");
  const status = STATUSES.has(rawStatus) ? (rawStatus as "DRAFT" | "PUBLISHED") : "DRAFT";
  if (!id || !blog || !slug) return;

  try {
    await adminApi.setStatus(id, status);

    revalidatePath("/admin");
    revalidatePath(`/${blog}`);
    revalidatePath(`/${blog}/${slug}`);
  } catch (e) {
    console.error("setStatus failed:", e);
  }
}

/** Permanently delete a post. */
export async function deletePost(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = str(formData, "id");
  const blog = str(formData, "blog");
  const slug = str(formData, "slug");
  if (!id || !blog || !slug) return;

  try {
    await adminApi.deletePost(id);

    revalidatePath("/admin");
    revalidatePath(`/${blog}`);
    revalidatePath(`/${blog}/${slug}`);
  } catch (e) {
    console.error("deletePost failed:", e);
  }
}

/** Count words from JSON content. */
function countWordsFromJson(contentJson: string): number {
  try {
    const blocks = JSON.parse(contentJson);
    if (!Array.isArray(blocks)) return 0;
    const text = blocks
      .map((b: { content?: unknown }) => extractText(b.content))
      .join(" ");
    return text.trim().split(/\s+/).filter(Boolean).length;
  } catch {
    return 0;
  }
}

function extractText(node: unknown): string {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(extractText).join(" ");
  if (node && typeof node === "object") {
    const n = node as { text?: string; content?: unknown };
    return `${n.text ?? ""} ${n.content ? extractText(n.content) : ""}`;
  }
  return "";
}
