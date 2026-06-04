"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { PartialBlock } from "@blocknote/core";
import { savePost } from "../actions";
import { initialSaveState } from "../lib/form-state";
import { slugify } from "@/app/lib/slug";
import { estimateReadTime } from "@/app/lib/read-time";
import TagInput from "./TagInput";
import type { Author, Category, Tag } from "@/app/lib/article-types";

const Editor = dynamic(() => import("./Editor"), {
  ssr: false,
  loading: () => (
    <p className="py-6 text-sm text-[#9A9A9A]">Loading editor…</p>
  ),
});

export type FormPost = {
  id: string;
  blog: "hive" | "learn";
  slug: string;
  title: string;
  seoTitle: string | null;
  seoDescription: string | null;
  description: string;
  lede: string | null;

  // Taxonomy (full objects from backend)
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

  // Content
  contentJson: Record<string, unknown> | null;
};

type Props = {
  post?: FormPost;
  defaultBlog?: string;
  /** Existing categories for dropdown. */
  categories?: Category[];
  /** Existing tags for autocomplete. */
  tagSuggestions?: string[];
  /** Existing authors for dropdown. */
  authors?: Author[];
  /** Internal site paths for the CTA link picker. */
  internalRoutes?: string[];
};

const inputClass =
  "w-full rounded-lg border border-[#DBDBDB] px-3 py-2 text-sm focus:border-[#FF8A7A] focus:outline-none";

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

function Labeled({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="mb-1 block text-sm font-semibold">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs font-medium text-[#B4332A]">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-[#9A9A9A]">{hint}</span>
      ) : null}
    </div>
  );
}

/** Sticky top action bar — uses form status for the saving state. */
function ActionBar({
  editing,
  isPublished,
  blog,
  setBlog,
  onSetStatus,
  onOpenSettings,
  liveHref,
}: {
  editing: boolean;
  isPublished: boolean;
  blog: string;
  setBlog: (b: string) => void;
  onSetStatus: (s: string) => void;
  onOpenSettings: () => void;
  liveHref?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <div className="sticky top-0 z-30 -mx-6 mb-6 flex items-center justify-between gap-3 border-b border-[#ECECEC] bg-[#FAFAFA]/90 px-6 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-sm text-[#545454] hover:text-black">
          ← Posts
        </Link>
        <select
          value={blog}
          onChange={(e) => setBlog(e.target.value)}
          className="rounded-md border border-[#DBDBDB] bg-white px-2 py-1 text-sm"
          aria-label="Blog"
        >
          <option value="hive">Hive</option>
          <option value="learn">Learn</option>
        </select>
        <span
          className={`hidden rounded-full px-2 py-0.5 text-xs font-semibold sm:inline ${
            isPublished ? "bg-[#E6F4EA] text-[#1E7B34]" : "bg-[#F2F2F2] text-[#777]"
          }`}
        >
          {isPublished ? "Published" : "Draft"}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {liveHref && (
          <Link
            href={liveHref}
            target="_blank"
            className="hidden text-sm text-[#545454] hover:text-black sm:inline"
          >
            View live ↗
          </Link>
        )}
        <button
          type="button"
          onClick={onOpenSettings}
          className="rounded-lg border border-[#DBDBDB] bg-white px-3 py-1.5 text-sm font-medium hover:bg-[#F2F2F2]"
        >
          Settings
        </button>
        <button
          type="submit"
          onClick={() => onSetStatus("DRAFT")}
          disabled={pending}
          className="rounded-lg border border-[#DBDBDB] bg-white px-3 py-1.5 text-sm font-medium hover:bg-[#F2F2F2] disabled:opacity-60"
        >
          Save draft
        </button>
        <button
          type="submit"
          onClick={() => onSetStatus("PUBLISHED")}
          disabled={pending}
          className="rounded-lg bg-[#FF8A7A] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#ff7765] disabled:opacity-60"
        >
          {pending ? "Saving…" : editing && isPublished ? "Update" : "Publish"}
        </button>
      </div>
    </div>
  );
}

export default function PostForm({
  post,
  defaultBlog,
  categories = [],
  tagSuggestions = [],
  authors = [],
  internalRoutes = [],
}: Props) {
  const [state, formAction] = useActionState(savePost, initialSaveState);
  const errors = state?.fieldErrors ?? {};

  const initialBlocks: PartialBlock[] = (() => {
    if (!post?.contentJson) return [];
    try {
      const parsed = post.contentJson;
      // Handle { blocks: [...] } format from backend
      if (parsed && typeof parsed === "object" && "blocks" in parsed && Array.isArray(parsed.blocks)) {
        return parsed.blocks as PartialBlock[];
      }
      // Handle raw array format
      if (Array.isArray(parsed)) {
        return parsed as PartialBlock[];
      }
      return [];
    } catch {
      return [];
    }
  })();

  const statusRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [blocks, setBlocks] = useState<PartialBlock[]>(initialBlocks);
  const [blog, setBlog] = useState(post?.blog ?? defaultBlog ?? "hive");
  const [title, setTitle] = useState(post?.title ?? "");
  const [description, setDescription] = useState(post?.description ?? "");
  const [seoTitle, setSeoTitle] = useState(post?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(post?.seoDescription ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(post?.slug));
  const [status, setStatus] = useState(post?.status ?? "DRAFT");
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Author handling - track selected ID or custom name
  const [authorId, setAuthorId] = useState(post?.author?.id ?? "");
  const [authorName, setAuthorName] = useState(post?.author?.name ?? "");

  // Category handling - track selected ID or custom name
  const [categoryId, setCategoryId] = useState(post?.category?.id ?? "");
  const [categoryName, setCategoryName] = useState(post?.category?.name ?? "");

  // Cover: existing path + an optional newly-picked preview.
  const [coverPath, setCoverPath] = useState(post?.coverImage ?? "");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // CTA link.
  const [ctaHref, setCtaHref] = useState(post?.ctaHref ?? "");
  const [ctaExternal, setCtaExternal] = useState(post?.ctaExternal ?? false);

  const effectiveSlug = slugTouched ? slug : slugify(title);
  const readTime = estimateReadTime(blocks);
  const metaTitle = (seoTitle || title || "Untitled").trim();
  const metaDesc = (seoDescription || description).trim();
  const isPublished = status === "PUBLISHED";
  const shownCover = coverPreview ?? (coverPath || null);
  const liveHref =
    post && post.status === "PUBLISHED" ? `/${post.blog}/${post.slug}` : undefined;

  // Filter categories by selected blog
  const blogCategories = categories.filter((c) => c.blog === blog);

  function pickCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setCoverPreview(URL.createObjectURL(file));
  }

  function setStatusForSubmit(s: string) {
    setStatus(s as "DRAFT" | "PUBLISHED");
    if (statusRef.current) statusRef.current.value = s;
  }

  // Handle author selection - either ID or custom name
  function handleAuthorChange(value: string) {
    const selectedAuthor = authors.find((a) => a.id === value);
    if (selectedAuthor) {
      setAuthorId(selectedAuthor.id);
      setAuthorName(selectedAuthor.name);
    } else {
      // Custom name entered
      setAuthorId("");
      setAuthorName(value);
    }
  }

  // Handle category selection
  function handleCategoryChange(value: string) {
    const selectedCategory = blogCategories.find((c) => c.id === value);
    if (selectedCategory) {
      setCategoryId(selectedCategory.id);
      setCategoryName(selectedCategory.name);
    } else {
      // Custom name entered
      setCategoryId("");
      setCategoryName(value);
    }
  }

  // Extract tag names for TagInput
  const initialTagNames = post?.tags?.map((t) => t.name) ?? [];

  return (
    <form action={formAction}>
      {post && <input type="hidden" name="id" value={post.id} />}
      <input type="hidden" name="coverImage" value={coverPath} />
      <input type="hidden" name="contentJson" value={JSON.stringify(blocks)} />
      <input type="hidden" name="slug" value={effectiveSlug} />
      <input type="hidden" name="blog" value={blog} />
      <input type="hidden" name="readTime" value="" />
      <input ref={statusRef} type="hidden" name="status" defaultValue={status} />
      {/* Author - send ID if available, otherwise name */}
      {authorId && <input type="hidden" name="authorId" value={authorId} />}
      <input type="hidden" name="authorName" value={authorName || "energiebee"} />
      {/* Category - send ID if available, otherwise name */}
      {categoryId && <input type="hidden" name="categoryId" value={categoryId} />}
      <input type="hidden" name="category" value={categoryName || "Uncategorised"} />
      {/* hidden cover file input, triggered from the cover zone */}
      <input
        ref={fileRef}
        type="file"
        name="coverFile"
        accept="image/*"
        onChange={pickCover}
        className="sr-only"
      />

      <ActionBar
        editing={Boolean(post)}
        isPublished={isPublished}
        blog={blog}
        setBlog={setBlog}
        onSetStatus={setStatusForSubmit}
        onOpenSettings={() => setSettingsOpen(true)}
        liveHref={liveHref}
      />

      {state?.error && (
        <div className="mx-auto mb-6 max-w-2xl rounded-lg border border-[#F3C2BC] bg-[#FDECEC] px-4 py-3 text-sm font-medium text-[#B4332A]">
          {state.error}
        </div>
      )}

      {/* Writing canvas */}
      <div className="mx-auto max-w-2xl">
        {/* cover */}
        {shownCover ? (
          <div className="group relative mb-6 overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shownCover} alt="" className="max-h-80 w-full object-cover" />
            <div className="absolute right-3 top-3 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="rounded-md bg-black/70 px-3 py-1.5 text-xs font-medium text-white"
              >
                Change
              </button>
              <button
                type="button"
                onClick={() => {
                  setCoverPreview(null);
                  setCoverPath("");
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="rounded-md bg-black/70 px-3 py-1.5 text-xs font-medium text-white"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mb-6 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#DBDBDB] py-8 text-sm font-medium text-[#777] hover:border-[#FF8A7A] hover:text-[#FF8A7A]"
          >
            <span className="text-lg">＋</span> Add a cover image
          </button>
        )}

        {/* title */}
        <textarea
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          // Auto-size on every render so long/edited titles fit on load.
          ref={(el) => {
            if (el) {
              el.style.height = "auto";
              el.style.height = `${el.scrollHeight}px`;
            }
          }}
          rows={1}
          placeholder="Post title…"
          className="post-title w-full resize-none border-none bg-transparent font-extrabold tracking-tight text-black placeholder:text-[#C9C9C9] focus:outline-none"
        />
        {errors.title && (
          <p className="mb-2 text-sm font-medium text-[#B4332A]">{errors.title}</p>
        )}

        {/* meta line */}
        <div className="mb-4 text-xs text-[#9A9A9A]">
          <span className="font-mono">/{blog}/{effectiveSlug || "…"}</span>
          {" · "}
          {readTime}
        </div>

        {/* tags */}
        <div className="mb-6">
          <TagInput
            name="tags"
            initial={initialTagNames}
            suggestions={tagSuggestions}
          />
        </div>

        {/* body */}
        <div className="post-editor">
          <Editor initialContent={initialBlocks} onChange={setBlocks} />
        </div>
      </div>

      {/* Settings drawer */}
      {settingsOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setSettingsOpen(false)}
          />
          <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-[#ECECEC] bg-white px-5 py-4">
              <h2 className="text-lg font-bold">Post settings</h2>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="rounded-lg bg-[#FF8A7A] px-4 py-1.5 text-sm font-semibold text-white"
              >
                Done
              </button>
            </div>

            <div className="space-y-5 p-5">
              <Labeled label="Excerpt" hint="Card blurb + meta description. Auto from the body if blank.">
                <textarea
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className={inputClass}
                />
              </Labeled>

              <Labeled
                label="Slug"
                error={errors.slug}
                hint="Auto from the title. Edit to override."
              >
                <input
                  value={effectiveSlug}
                  onChange={(e) => {
                    setSlug(slugify(e.target.value));
                    setSlugTouched(true);
                  }}
                  className={`${inputClass} font-mono`}
                />
                <span className="mt-1 block text-xs text-[#9A9A9A]">
                  /{blog}/{effectiveSlug || "…"}
                </span>
              </Labeled>

              <Labeled label="Category" hint="Pick an existing one or type a new category.">
                <input
                  value={categoryName}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  placeholder="Uncategorised"
                  list="category-options"
                  className={inputClass}
                />
                <datalist id="category-options">
                  {blogCategories.map((c) => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>
              </Labeled>

              <Labeled label="Lede" hint="Bold subtitle under the title.">
                <input name="lede" defaultValue={post?.lede ?? ""} className={inputClass} />
              </Labeled>

              {/* SEO */}
              <div className="space-y-3 rounded-lg border border-[#ECECEC] p-3">
                <span className="text-sm font-semibold">Search preview</span>
                <div className="rounded-md border border-[#EEE] p-2.5">
                  <div className="text-xs text-[#1a6b2f]">
                    energiebee.com › {blog} › {effectiveSlug || "…"}
                  </div>
                  <div className="text-[#1a0dab] leading-tight">
                    {truncate(metaTitle, 60)}
                  </div>
                  <div className="mt-0.5 text-xs text-[#4d5156]">
                    {truncate(metaDesc || "Add a description…", 150)}
                  </div>
                </div>
                <Labeled label="SEO title" hint="Defaults to the title.">
                  <input
                    name="seoTitle"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder={title || "Defaults to title"}
                    className={inputClass}
                  />
                </Labeled>
                <Labeled label="SEO description" hint="Defaults to the excerpt.">
                  <textarea
                    name="seoDescription"
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    rows={2}
                    placeholder={description || "Defaults to excerpt"}
                    className={inputClass}
                  />
                </Labeled>
              </div>

              <Labeled label="Author" hint="Select an existing author or type a new name.">
                <input
                  value={authorName}
                  onChange={(e) => handleAuthorChange(e.target.value)}
                  placeholder="energiebee"
                  list="author-options"
                  className={inputClass}
                />
                <datalist id="author-options">
                  {authors.map((a) => (
                    <option key={a.id} value={a.name} />
                  ))}
                </datalist>
              </Labeled>
              <Labeled label="Author date" hint="Defaults to today.">
                <input
                  name="authorDate"
                  defaultValue={post?.authorDate ?? ""}
                  placeholder="e.g. 2026-06-01"
                  type="date"
                  className={inputClass}
                />
              </Labeled>

              {/* featured */}
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  name="featured"
                  defaultChecked={post?.featured}
                  className="h-4 w-4"
                />
                Feature in the carousel
              </label>
              <Labeled label="Carousel intro" hint="Auto-filled from lede/excerpt if blank.">
                <textarea
                  name="carouselIntro"
                  defaultValue={post?.carouselIntro ?? ""}
                  rows={2}
                  className={inputClass}
                />
              </Labeled>
              <Labeled label="Carousel body" hint="Auto-filled from the excerpt if blank.">
                <textarea
                  name="carouselBody"
                  defaultValue={post?.carouselBody ?? ""}
                  rows={3}
                  className={inputClass}
                />
              </Labeled>

              {/* Call to action */}
              <div className="space-y-3 rounded-lg border border-[#ECECEC] p-3">
                <span className="text-sm font-semibold">Call to action</span>
                <Labeled label="Button label" hint="Leave blank for no CTA.">
                  <input
                    name="ctaLabel"
                    defaultValue={post?.ctaLabel ?? ""}
                    placeholder="Try energiebee for free"
                    className={inputClass}
                  />
                </Labeled>

                {/* internal / external toggle */}
                <input
                  type="hidden"
                  name="ctaExternal"
                  value={ctaExternal ? "on" : ""}
                />
                <div className="inline-flex rounded-lg border border-[#DBDBDB] p-0.5 text-sm">
                  <button
                    type="button"
                    onClick={() => setCtaExternal(false)}
                    className={`rounded-md px-3 py-1 font-medium ${
                      !ctaExternal ? "bg-[#FF8A7A] text-white" : "text-[#545454]"
                    }`}
                  >
                    Internal page
                  </button>
                  <button
                    type="button"
                    onClick={() => setCtaExternal(true)}
                    className={`rounded-md px-3 py-1 font-medium ${
                      ctaExternal ? "bg-[#FF8A7A] text-white" : "text-[#545454]"
                    }`}
                  >
                    External link
                  </button>
                </div>

                {ctaExternal ? (
                  <Labeled
                    label="External URL"
                    hint="Opens in a new tab. https:// is added if you omit it."
                  >
                    <input
                      name="ctaHref"
                      type="url"
                      value={ctaHref}
                      onChange={(e) => setCtaHref(e.target.value)}
                      placeholder="https://example.com"
                      className={inputClass}
                    />
                  </Labeled>
                ) : (
                  <Labeled
                    label="Internal page"
                    hint="Search an existing page. Opens in the same tab."
                  >
                    <input
                      name="ctaHref"
                      value={ctaHref}
                      onChange={(e) => setCtaHref(e.target.value)}
                      placeholder="/start"
                      list="route-options"
                      className={`${inputClass} font-mono`}
                    />
                    <datalist id="route-options">
                      {internalRoutes.map((r) => (
                        <option key={r} value={r} />
                      ))}
                    </datalist>
                  </Labeled>
                )}
              </div>

              <Labeled label="Cover image alt" hint="Defaults to the title.">
                <input
                  name="coverImageAlt"
                  defaultValue={post?.coverImageAlt ?? ""}
                  className={inputClass}
                />
              </Labeled>
            </div>
          </aside>
        </>
      )}
    </form>
  );
}
