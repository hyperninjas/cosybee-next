"use server";

import { revalidatePath } from "next/cache";
import { revalidateContent } from "@/app/lib/revalidate";
import { slugify, normalizeTag } from "@/app/lib/slug";
import { excerptFromJson } from "@/app/lib/read-time";
import { contentJsonToHtml } from "@/app/lib/blocknote";
import { findContentImagesMissingAlt } from "@/app/lib/content-images";
import { adminApi, type AdminPost } from "./lib/api";
import { api, type Blog } from "@/app/lib/api";
import type { EntitySaveState } from "./lib/form-state";
import { assertAdmin } from "./lib/auth";

const BLOGS = new Set(["hive", "learn"]);
const STATUSES = new Set(["DRAFT", "PUBLISHED", "ARCHIVED"]);
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

/** Human label for a post status, for the "already used by" message. */
function statusLabel(status: string): string {
  return status === "PUBLISHED"
    ? "published"
    : status === "ARCHIVED"
      ? "archived"
      : "draft";
}

export type SlugCheck =
  | { state: "idle" }
  | { state: "invalid"; message: string }
  | { state: "available" }
  // Free to use, but an old URL currently redirects here. Taking it silently
  // breaks that redirect, so the author is told before they do.
  | { state: "retired"; message: string }
  | { state: "taken"; message: string }
  | { state: "error"; message: string };

/**
 * Is `slug` free within `blog`? Called from the editor as the admin types, and
 * again by `savePost` — one implementation, so the inline hint and the save
 * decision can never disagree.
 *
 * The slug used to be auto-suffixed (-2, -3…) on collision, silently. That is
 * gone: an author who typed a slug gets that slug or an explicit reason why
 * not, never a URL they didn't choose.
 */
export async function checkSlug(
  blog: string,
  rawSlug: string,
  excludeId?: string,
): Promise<SlugCheck> {
  await assertAdmin();
  if (!BLOGS.has(blog)) return { state: "invalid", message: "Unknown blog." };

  // Always check the CANONICAL form — the field is mid-edit when this runs,
  // so it can legitimately hold a trailing hyphen ("heat-" on the way to
  // "heat-pump"). Comparing raw against canonical here reported that as
  // invalid input, which is just someone typing.
  const slug = slugify(rawSlug);
  if (!slug) return { state: "idle" };

  try {
    const owner = await adminApi.findPostBySlug(blog, slug, excludeId);
    if (owner) {
      return {
        state: "taken",
        message: `Already used by “${owner.title}” (${statusLabel(owner.status)}).`,
      };
    }
    // No live post holds it — but a retired address might, in which case
    // taking it retires the redirect that address currently serves.
    const retired = await api.resolvePostSlug(blog as Blog, slug);
    if (retired && retired.id !== excludeId) {
      return {
        state: "retired",
        message: `Free, but an old URL redirects here to “${retired.title}”. Using it drops that redirect.`,
      };
    }
    return { state: "available" };
  } catch {
    // Never claim "available" on a failed lookup — that is how a duplicate
    // slips through to the database's unique index.
    return {
      state: "error",
      message: "Couldn't check availability. It will be re-checked on save.",
    };
  }
}

/**
 * Create or update a post. Returns an {@link EntitySaveState} with inline field
 * errors on validation failure; on success it returns the saved post and
 * stays put — the editor toasts and keeps the author where they were rather
 * than bouncing to the dashboard.
 */
export async function savePost(
  _prev: EntitySaveState<AdminPost>,
  formData: FormData,
): Promise<EntitySaveState<AdminPost>> {
  await assertAdmin();

  const id = optStr(formData, "id");
  const rawBlog = str(formData, "blog");
  const blog = BLOGS.has(rawBlog) ? (rawBlog as "hive" | "learn") : "hive";
  const rawStatus = str(formData, "status");
  const status = STATUSES.has(rawStatus)
    ? (rawStatus as "DRAFT" | "PUBLISHED" | "ARCHIVED")
    : "DRAFT";
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

  // Cover: upload new file or keep existing. No upload + no existing cover →
  // save it empty rather than persisting the "/bee-flower.png" placeholder
  // (that stand-in is for listing display only, not real post data).
  const uploaded = await uploadToBackend(formData.get("coverFile") as File | null);
  const coverImage = uploaded ?? str(formData, "coverImage");

  // Validation
  const fieldErrors: Record<string, string> = {};
  if (!title) fieldErrors.title = "Add a title before saving.";

  // The slug is the author's to choose — no longer derived from the title as
  // a fallback, and never auto-suffixed on collision. Both of those changed a
  // deliberate URL behind the author's back.
  const slug = slugify(str(formData, "slug"));
  if (!slug) {
    fieldErrors.slug = "Add a slug — it's the article's URL.";
  } else {
    // Re-checked here rather than trusting the editor's inline hint: the hint
    // can be stale by the time Save is pressed, and this is the last point
    // before the database's unique index turns it into an opaque 500.
    const check = await checkSlug(blog, slug, id ?? undefined);
    if (check.state === "taken" || check.state === "invalid") {
      fieldErrors.slug = check.message;
    } else if (check.state === "error") {
      return {
        ok: false,
        error: "Couldn't verify the slug is free. Try saving again.",
      };
    }
  }

  // The backend rejects any content image without alt text. Catch it here so
  // the error surfaces inline instead of as a raw 400 from the upstream API.
  const missingAlts = findContentImagesMissingAlt(blocks);
  if (missingAlts.length > 0) {
    const list = missingAlts.map((m) => `#${m.index}`).join(", ");
    return {
      ok: false,
      error: `Add alt text to content image${missingAlts.length === 1 ? "" : "s"} ${list} before saving.`,
    };
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      error: "Fix the highlighted fields before saving.",
      fieldErrors,
    };
  }

  // Derived values
  const readTimeMinutes = parseInt(str(formData, "readTime")) ||
    Math.max(1, Math.round(countWordsFromJson(contentJsonStr) / 200));
  const description = str(formData, "description") || excerptFromJson(contentJsonStr) || title || "No description";
  const tags = parseTags(formData);
  const featured = formData.get("featured") === "on";
  const homeFeatured = formData.get("homeFeatured") === "on";

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

  // Scheduling. The form now sends an ABSOLUTE instant (ISO, with a `Z`),
  // converted in the browser where the author's timezone is actually known —
  // see `localDateTimeToInstant` in PostForm. Do NOT go back to parsing a bare
  // "YYYY-MM-DDTHH:mm" here: a string with no offset resolves against THIS
  // process's timezone, so a UTC server read an author's BST wall-clock time
  // an hour early, and every save pushed a published post's time further into
  // the future until it silently stopped being live.
  //
  // An empty string still means "publish immediately" — we send null so the
  // backend uses its own clock.
  const publishedAtRaw = str(formData, "publishedAt");
  const publishedAtIso = (() => {
    if (!publishedAtRaw) return null;
    const d = new Date(publishedAtRaw);
    return isNaN(d.getTime()) ? null : d.toISOString();
  })();

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
    coverImageTitle: optStr(formData, "coverImageTitle"),
    coverImageCaption: optStr(formData, "coverImageCaption"),
    coverImageCredit: optStr(formData, "coverImageCredit"),
    // SEO / social
    ogImage: optStr(formData, "ogImage"),
    ogImageAlt: optStr(formData, "ogImageAlt"),
    canonicalUrl: optStr(formData, "canonicalUrl"),
    noindex: formData.get("noindex") === "on",
    // Scheduling
    publishedAt: publishedAtIso,
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
    homeFeatured,
    status,
    // Only include content if editor has blocks - preserves legacy content on metadata-only edits
    ...(contentJson !== undefined ? { contentJson } : {}),
    ...(contentHtml !== undefined ? { contentHtml } : {}),
  };

  let saved: AdminPost;
  try {
    saved = id
      ? await adminApi.updatePost(id, data)
      : await adminApi.createPost(data);
  } catch (e) {
    return { ok: false, error: `Could not save: ${(e as Error).message}` };
  }

  revalidatePath("/admin");
  revalidateContent();
  revalidatePath(`/${blog}`);
  revalidatePath(`/${blog}/${slug}`);
  // A moved post leaves a prerendered page behind at its old address. Without
  // this the stale page keeps being served from the cache and the new 308
  // never runs — the redirect would look broken for as long as the cache
  // lives. The previous address comes from the form, which holds the record
  // as the server last returned it.
  const previousBlog = str(formData, "previousBlog");
  const previousSlug = str(formData, "previousSlug");
  if (previousSlug && (previousBlog !== blog || previousSlug !== slug)) {
    revalidatePath(`/${previousBlog || blog}/${previousSlug}`);
  }
  // The saved record rides back with the state so the form can adopt it. That
  // matters most for a CREATE: the editor stays open, and without the new id
  // its `id` field would still be empty and the next save would write a
  // second post instead of updating this one.
  return { ok: true, entity: saved };
}

/** Result of a dashboard quick-action — the caller toasts on this. */
export type ActionResult = { ok: boolean; error?: string };

/** Flip a post between DRAFT and PUBLISHED from the dashboard. */
export async function setStatus(formData: FormData): Promise<ActionResult> {
  await assertAdmin();
  const id = str(formData, "id");
  const blog = str(formData, "blog");
  const slug = str(formData, "slug");
  const rawStatus = str(formData, "status");
  const status = STATUSES.has(rawStatus)
    ? (rawStatus as "DRAFT" | "PUBLISHED" | "ARCHIVED")
    : "DRAFT";
  if (!id || !blog || !slug) return { ok: false, error: "Missing post details." };

  try {
    await adminApi.setStatus(id, status);

    revalidatePath("/admin");
    revalidateContent();
    revalidatePath(`/${blog}`);
    revalidatePath(`/${blog}/${slug}`);
    return { ok: true };
  } catch (e) {
    console.error("setStatus failed:", e);
    return { ok: false, error: (e as Error).message };
  }
}

/** Toggle a post's carousel-featured flag from the dashboard. */
export async function setFeatured(formData: FormData): Promise<ActionResult> {
  await assertAdmin();
  const id = str(formData, "id");
  const blog = str(formData, "blog");
  const slug = str(formData, "slug");
  const featured = formData.get("featured") === "on";
  if (!id) return { ok: false, error: "Missing post id." };

  try {
    await adminApi.updatePost(id, { featured });

    revalidatePath("/admin");
    revalidateContent();
    revalidatePath(`/${blog}`);
    revalidatePath(`/${blog}/${slug}`);
    return { ok: true };
  } catch (e) {
    console.error("setFeatured failed:", e);
    return { ok: false, error: (e as Error).message };
  }
}

/** Toggle a post's home-page-featured flag from the dashboard. */
export async function setHomeFeatured(formData: FormData): Promise<ActionResult> {
  await assertAdmin();
  const id = str(formData, "id");
  const blog = str(formData, "blog");
  const slug = str(formData, "slug");
  const homeFeatured = formData.get("homeFeatured") === "on";
  if (!id) return { ok: false, error: "Missing post id." };

  try {
    await adminApi.updatePost(id, { homeFeatured });

    revalidatePath("/admin");
    revalidateContent();
    revalidatePath("/"); // home page featured-articles section
    revalidatePath(`/${blog}`);
    revalidatePath(`/${blog}/${slug}`);
    return { ok: true };
  } catch (e) {
    console.error("setHomeFeatured failed:", e);
    return { ok: false, error: (e as Error).message };
  }
}

/** Permanently delete a post. */
export async function deletePost(formData: FormData): Promise<ActionResult> {
  await assertAdmin();
  const id = str(formData, "id");
  const blog = str(formData, "blog");
  const slug = str(formData, "slug");
  if (!id || !blog || !slug) return { ok: false, error: "Missing post details." };

  try {
    await adminApi.deletePost(id);

    revalidatePath("/admin");
    revalidateContent();
    revalidatePath(`/${blog}`);
    revalidatePath(`/${blog}/${slug}`);
    return { ok: true };
  } catch (e) {
    console.error("deletePost failed:", e);
    return { ok: false, error: (e as Error).message };
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
