"use server";

import sharp from "sharp";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/db";
import { contentJsonToHtml } from "@/app/lib/blocknote";
import { slugify, normalizeTag } from "@/app/lib/slug";
import { estimateReadTimeFromJson, excerptFromJson } from "@/app/lib/read-time";
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

/** Today as e.g. "1 Jun 2026". */
function formatToday(): string {
  const d = new Date();
  const month = d.toLocaleString("en-GB", { month: "short" });
  return `${d.getDate()} ${month} ${d.getFullYear()}`;
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
 * Persist an uploaded image to the database (BLOB) and return its
 * `/media/[id]` URL. Re-encodes to web-friendly WebP (max 1600px,
 * auto-oriented) so a 5MB phone photo isn't stored/served at full size.
 * Storing in the DB means uploads work on a read-only serverless
 * filesystem with no external blob service.
 */
async function persistUpload(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const input = Buffer.from(await file.arrayBuffer());

  let data: Buffer;
  let mimeType: string;
  try {
    data = await sharp(input)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    mimeType = "image/webp";
  } catch {
    // Formats sharp can't process (e.g. SVG) — store as-is.
    data = input;
    mimeType = file.type || "application/octet-stream";
  }

  const media = await prisma.media.create({ data: { data, mimeType } });
  return `/media/${media.id}`;
}

/**
 * Upload a single image (used by the in-editor image block) and return
 * its public URL. Invoked from the client editor's `uploadFile` hook.
 */
export async function uploadImage(formData: FormData): Promise<string> {
  await assertAdmin();
  const url = await persistUpload(formData.get("file") as File | null);
  if (!url) throw new Error("No file provided");
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
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const clash = await prisma.post.findFirst({
      where: { blog, slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    if (!clash) return slug;
    slug = `${base}-${n++}`;
  }
}

/**
 * Create or update a post. Returns a {@link SaveState} with inline
 * field errors on validation failure (rendered in the form); on
 * success it revalidates affected paths and redirects to the dashboard.
 *
 * Reduces manual work: derives the slug, computes read time from the
 * body, and defaults SEO/author/carousel fields when left blank.
 */
export async function savePost(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  await assertAdmin();

  const id = optStr(formData, "id");
  // Coerce the controlled fields to safe values rather than erroring.
  const rawBlog = str(formData, "blog");
  const blog = BLOGS.has(rawBlog) ? rawBlog : "hive";
  const rawStatus = str(formData, "status");
  const status = STATUSES.has(rawStatus) ? rawStatus : "DRAFT";
  const title = str(formData, "title");
  const contentJson = str(formData, "contentJson") || "[]";

  // Cover: a new upload wins, else the existing path, else a fallback —
  // so a post can publish with nothing but a title (Medium-style).
  const uploaded = await persistUpload(formData.get("coverFile") as File | null);
  const coverImage =
    uploaded ?? (str(formData, "coverImage") || "/bee-flower.png");

  // --- validation (only the title is truly required) ----------------
  const fieldErrors: Record<string, string> = {};
  if (!title) fieldErrors.title = "Add a title before saving.";

  const base = slugify(str(formData, "slug") || title);
  if (title && !base) fieldErrors.slug = "Could not derive a slug from the title.";

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
  }

  // --- derived / auto-filled values ---------------------------------
  const slug = await uniqueSlug(blog, base, id);
  const contentHtml = await contentJsonToHtml(contentJson);
  const readTime = str(formData, "readTime") || estimateReadTimeFromJson(contentJson);
  // Excerpt: explicit description, else first slice of the body.
  const description =
    str(formData, "description") || excerptFromJson(contentJson);
  const tags = parseTags(formData);
  const featured = formData.get("featured") === "on";

  // CTA: internal links get a leading slash; external links get a
  // protocol (and render with target=_blank via the ctaExternal flag).
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

  // Featured posts need carousel copy — fall back to lede/description.
  const lede = optStr(formData, "lede");
  const carouselIntro =
    optStr(formData, "carouselIntro") ?? (featured ? lede ?? description : null);
  const carouselBody =
    optStr(formData, "carouselBody") ?? (featured ? description : null);

  const data = {
    blog,
    slug,
    title,
    seoTitle: optStr(formData, "seoTitle"),
    seoDescription: optStr(formData, "seoDescription"),
    description,
    category: str(formData, "category") || "Uncategorized",
    tags: JSON.stringify(tags),
    readTime,
    coverImage,
    coverImageAlt: str(formData, "coverImageAlt") || title,
    lede,
    ctaLabel,
    ctaHref,
    ctaExternal: ctaHref ? ctaExternal : false,
    authorName: str(formData, "authorName") || "energiebee",
    authorDate: str(formData, "authorDate") || formatToday(),
    carouselIntro,
    carouselBody,
    featured,
    status,
    contentJson,
    contentHtml,
  };

  try {
    if (id) {
      const existing = await prisma.post.findUnique({
        where: { id },
        select: { publishedAt: true },
      });
      await prisma.post.update({
        where: { id },
        data: {
          ...data,
          publishedAt:
            status === "PUBLISHED" && !existing?.publishedAt
              ? new Date()
              : existing?.publishedAt ?? null,
        },
      });
    } else {
      await prisma.post.create({
        data: {
          ...data,
          publishedAt: status === "PUBLISHED" ? new Date() : null,
        },
      });
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
  const status = str(formData, "status");
  if (!id || !STATUSES.has(status)) return;

  const post = await prisma.post.findUnique({
    where: { id },
    select: { blog: true, slug: true, publishedAt: true },
  });
  if (!post) return;

  await prisma.post.update({
    where: { id },
    data: {
      status,
      publishedAt:
        status === "PUBLISHED" && !post.publishedAt ? new Date() : post.publishedAt,
    },
  });

  revalidatePath("/admin");
  revalidatePath(`/${post.blog}`);
  revalidatePath(`/${post.blog}/${post.slug}`);
}

/** Permanently delete a post. */
export async function deletePost(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = str(formData, "id");
  if (!id) return;

  const post = await prisma.post.findUnique({
    where: { id },
    select: { blog: true, slug: true },
  });
  if (!post) return;

  await prisma.post.delete({ where: { id } });

  revalidatePath("/admin");
  revalidatePath(`/${post.blog}`);
  revalidatePath(`/${post.blog}/${post.slug}`);
}
