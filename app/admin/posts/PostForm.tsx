"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
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
import { PublicImageUpload } from "@/app/components/storage/PublicImageUpload";

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

/** Section header with optional action */
function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-semibold text-[#333]">{title}</span>
      {action}
    </div>
  );
}

/** Derive initials from a name */
function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/** Author selection card */
function AuthorCard({
  author,
  selected,
  onSelect,
}: {
  author: Author;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
        selected
          ? "border-[#FF8A7A] bg-[#FFF5F4] ring-1 ring-[#FF8A7A]"
          : "border-[#ECECEC] bg-white hover:border-[#DBDBDB] hover:bg-[#FAFAFA]"
      }`}
    >
      {author.avatarUrl ? (
        <Image
          src={author.avatarUrl}
          alt={author.name}
          width={40}
          height={40}
          className="h-10 w-10 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFE4E1] text-sm font-semibold text-[#C0362C]">
          {initialsFrom(author.name)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-[#333]">{author.name}</div>
        {author.role && (
          <div className="truncate text-xs text-[#9A9A9A]">{author.role}</div>
        )}
      </div>
      {selected && (
        <svg
          className="h-5 w-5 shrink-0 text-[#FF8A7A]"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </button>
  );
}

/** Category selection pill */
function CategoryPill({
  category,
  selected,
  onSelect,
}: {
  category: Category;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
        selected
          ? "border-[#FF8A7A] bg-[#FF8A7A] text-white"
          : "border-[#DBDBDB] bg-white text-[#545454] hover:border-[#FF8A7A] hover:text-[#FF8A7A]"
      }`}
    >
      {category.name}
    </button>
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
      // Handle { blocks: [...] } format from backend (BlockNote format)
      if (parsed && typeof parsed === "object" && "blocks" in parsed && Array.isArray(parsed.blocks)) {
        return parsed.blocks as PartialBlock[];
      }
      // Handle raw array format (BlockNote format)
      if (Array.isArray(parsed)) {
        return parsed as PartialBlock[];
      }
      // Handle legacy format: { sections: [{ heading, paragraphs, blocks }] }
      if (parsed && typeof parsed === "object" && "sections" in parsed && Array.isArray(parsed.sections)) {
        const blocks: PartialBlock[] = [];
        type LegacyBlock = string | { items: string[] };
        type LegacySection = { heading?: string; paragraphs?: string[]; blocks?: LegacyBlock[] };

        for (const section of parsed.sections as LegacySection[]) {
          // Add section heading if present
          if (section.heading) {
            blocks.push({
              type: "heading",
              props: { level: 2 },
              content: [{ type: "text", text: section.heading, styles: {} }],
            });
          }
          // Add paragraphs (legacy format)
          if (section.paragraphs && Array.isArray(section.paragraphs)) {
            for (const para of section.paragraphs) {
              if (typeof para === "string" && para.trim()) {
                blocks.push({
                  type: "paragraph",
                  content: [{ type: "text", text: para, styles: {} }],
                });
              }
            }
          }
          // Add blocks (can be strings or objects with items)
          if (section.blocks && Array.isArray(section.blocks)) {
            for (const block of section.blocks) {
              if (typeof block === "string" && block.trim()) {
                // Plain text block
                blocks.push({
                  type: "paragraph",
                  content: [{ type: "text", text: block, styles: {} }],
                });
              } else if (block && typeof block === "object" && "items" in block) {
                // Bullet list
                const items = (block as { items: string[] }).items;
                if (Array.isArray(items)) {
                  for (const item of items) {
                    if (typeof item === "string" && item.trim()) {
                      blocks.push({
                        type: "bulletListItem",
                        content: [{ type: "text", text: item, styles: {} }],
                      });
                    }
                  }
                }
              }
            }
          }
        }
        return blocks;
      }
      return [];
    } catch {
      return [];
    }
  })();

  const statusRef = useRef<HTMLInputElement>(null);

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

  // Author handling - track selected ID, name, and avatar
  const [authorId, setAuthorId] = useState(post?.author?.id ?? "");
  const [authorName, setAuthorName] = useState(post?.author?.name ?? "");
  const [authorAvatarUrl, setAuthorAvatarUrl] = useState(post?.author?.avatarUrl ?? "");

  // Category handling - track selected ID or custom name
  const [categoryId, setCategoryId] = useState(post?.category?.id ?? "");
  const [categoryName, setCategoryName] = useState(post?.category?.name ?? "");

  // Cover image URL (from S3)
  const [coverUrl, setCoverUrl] = useState(post?.coverImage ?? "");

  // CTA link.
  const [ctaHref, setCtaHref] = useState(post?.ctaHref ?? "");
  const [ctaExternal, setCtaExternal] = useState(post?.ctaExternal ?? false);

  // Author date - needs state because the input is in the conditionally rendered drawer
  const [authorDate, setAuthorDate] = useState(() => {
    if (post?.authorDate) {
      return new Date(post.authorDate).toISOString().split("T")[0];
    }
    return new Date().toISOString().split("T")[0]; // Default to today
  });

  // Other drawer fields - need state so they're submitted even when drawer is closed
  const [coverImageAlt, setCoverImageAlt] = useState(post?.coverImageAlt ?? "");
  const [lede, setLede] = useState(post?.lede ?? "");
  const [featured, setFeatured] = useState(post?.featured ?? false);
  const [carouselIntro, setCarouselIntro] = useState(post?.carouselIntro ?? "");
  const [carouselBody, setCarouselBody] = useState(post?.carouselBody ?? "");
  const [ctaLabel, setCtaLabel] = useState(post?.ctaLabel ?? "");

  const effectiveSlug = slugTouched ? slug : slugify(title);
  const readTime = estimateReadTime(blocks);
  const metaTitle = (seoTitle || title || "Untitled").trim();
  const metaDesc = (seoDescription || description).trim();
  const isPublished = status === "PUBLISHED";
  const liveHref =
    post && post.status === "PUBLISHED" ? `/${post.blog}/${post.slug}` : undefined;

  // Filter categories by selected blog
  const blogCategories = categories.filter((c) => c.blog === blog);

  function setStatusForSubmit(s: string) {
    setStatus(s as "DRAFT" | "PUBLISHED");
    if (statusRef.current) statusRef.current.value = s;
  }

  // Handle author selection - either ID or custom name
  function handleAuthorChange(value: string) {
    const selectedAuthor = authors.find((a) => a.id === value || a.name === value);
    if (selectedAuthor) {
      setAuthorId(selectedAuthor.id);
      setAuthorName(selectedAuthor.name);
      setAuthorAvatarUrl(selectedAuthor.avatarUrl ?? "");
    } else {
      // Custom name entered
      setAuthorId("");
      setAuthorName(value);
      // Keep avatar if user is just changing the name
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
      <input type="hidden" name="coverImage" value={coverUrl} />
      <input type="hidden" name="contentJson" value={JSON.stringify(blocks)} />
      <input type="hidden" name="slug" value={effectiveSlug} />
      <input type="hidden" name="blog" value={blog} />
      <input type="hidden" name="readTime" value="" />
      <input ref={statusRef} type="hidden" name="status" defaultValue={status} />
      {/* Author - send ID if available, otherwise name + avatar */}
      {authorId && <input type="hidden" name="authorId" value={authorId} />}
      <input type="hidden" name="authorName" value={authorName || "energiebee"} />
      <input type="hidden" name="authorAvatarUrl" value={authorAvatarUrl} />
      {/* Category - send ID if available, otherwise name */}
      {categoryId && <input type="hidden" name="categoryId" value={categoryId} />}
      <input type="hidden" name="category" value={categoryName || "Uncategorised"} />
      {/* Author date - hidden input ensures it's always submitted even when drawer is closed */}
      <input type="hidden" name="authorDate" value={authorDate} />
      {/* Other drawer fields - hidden inputs ensure submission when drawer is closed */}
      <input type="hidden" name="description" value={description} />
      <input type="hidden" name="coverImageAlt" value={coverImageAlt} />
      <input type="hidden" name="lede" value={lede} />
      <input type="hidden" name="seoTitle" value={seoTitle} />
      <input type="hidden" name="seoDescription" value={seoDescription} />
      <input type="hidden" name="featured" value={featured ? "on" : ""} />
      <input type="hidden" name="carouselIntro" value={carouselIntro} />
      <input type="hidden" name="carouselBody" value={carouselBody} />
      <input type="hidden" name="ctaLabel" value={ctaLabel} />
      <input type="hidden" name="ctaHref" value={ctaHref} />
      <input type="hidden" name="ctaExternal" value={ctaExternal ? "on" : ""} />

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
        {/* cover - S3 upload */}
        <div className="mb-6">
          <PublicImageUpload
            context="blog-cover"
            value={coverUrl || null}
            onChange={(url) => setCoverUrl(url ?? "")}
          />
        </div>

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
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#ECECEC] bg-white px-5 py-4 shadow-sm">
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
              {/* Cover Image - FIRST */}
              <div className="space-y-3 rounded-lg border border-[#ECECEC] p-4">
                <SectionHeader title="Cover Image" />
                <PublicImageUpload
                  context="blog-cover"
                  value={coverUrl || null}
                  onChange={(url) => setCoverUrl(url ?? "")}
                />
                <Labeled label="Alt text" hint="Describes the image for accessibility. Defaults to the title.">
                  <input
                    value={coverImageAlt}
                    onChange={(e) => setCoverImageAlt(e.target.value)}
                    placeholder={title || "Enter alt text…"}
                    className={inputClass}
                  />
                </Labeled>
              </div>

              {/* Author section - SECOND */}
              <div className="space-y-4 rounded-lg border border-[#ECECEC] p-4">
                <SectionHeader
                  title="Author"
                  action={
                    <span className="text-xs text-[#9A9A9A]">
                      {authors.length} author{authors.length !== 1 ? "s" : ""}
                    </span>
                  }
                />

                {/* Existing authors list */}
                {authors.length > 0 && (
                  <div className="max-h-48 space-y-2 overflow-y-auto">
                    {authors.map((a) => (
                      <AuthorCard
                        key={a.id}
                        author={a}
                        selected={authorId === a.id}
                        onSelect={() => {
                          setAuthorId(a.id);
                          setAuthorName(a.name);
                          setAuthorAvatarUrl(a.avatarUrl ?? "");
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#ECECEC]" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-2 text-xs text-[#9A9A9A]">or create new</span>
                  </div>
                </div>

                {/* New author input */}
                <div className="space-y-3">
                  <Labeled label="Name" hint="Type a new author name.">
                    <input
                      value={authorId ? "" : authorName}
                      onChange={(e) => {
                        setAuthorId("");
                        setAuthorName(e.target.value);
                      }}
                      placeholder="New author name…"
                      className={inputClass}
                    />
                  </Labeled>
                  <Labeled label="Avatar" hint="Profile picture for new author (max 2MB).">
                    <PublicImageUpload
                      context="user-avatar"
                      value={authorId ? null : (authorAvatarUrl || null)}
                      onChange={(url) => {
                        if (!authorId) {
                          setAuthorAvatarUrl(url ?? "");
                        }
                      }}
                    />
                  </Labeled>
                </div>

                {/* Selected author preview */}
                {(authorId || authorName) && (
                  <div className="rounded-lg bg-[#F8F8F8] p-3">
                    <span className="mb-2 block text-xs font-medium text-[#9A9A9A]">Selected</span>
                    <div className="flex items-center gap-3">
                      {authorAvatarUrl ? (
                        <Image
                          src={authorAvatarUrl}
                          alt={authorName}
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFE4E1] text-xs font-semibold text-[#C0362C]">
                          {initialsFrom(authorName || "?")}
                        </div>
                      )}
                      <span className="text-sm font-medium">{authorName || "Unknown"}</span>
                      {authorId && (
                        <span className="ml-auto rounded bg-[#E6F4EA] px-1.5 py-0.5 text-xs text-[#1E7B34]">
                          Existing
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Category section - THIRD */}
              <div className="space-y-3 rounded-lg border border-[#ECECEC] p-4">
                <SectionHeader
                  title="Category"
                  action={
                    <span className="text-xs text-[#9A9A9A]">
                      {blogCategories.length} in {blog}
                    </span>
                  }
                />
                {blogCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {blogCategories.map((c) => (
                      <CategoryPill
                        key={c.id}
                        category={c}
                        selected={categoryId === c.id}
                        onSelect={() => {
                          setCategoryId(c.id);
                          setCategoryName(c.name);
                        }}
                      />
                    ))}
                  </div>
                )}
                <input
                  value={categoryName}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  placeholder={blogCategories.length > 0 ? "Or type a new category…" : "Enter category name…"}
                  className={inputClass}
                />
              </div>

              {/* Excerpt */}
              <Labeled label="Excerpt" hint="Card blurb + meta description. Auto from the body if blank.">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className={inputClass}
                />
              </Labeled>

              {/* Slug */}
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

              {/* Author date */}
              <Labeled label="Author date" hint="Defaults to today.">
                <input
                  value={authorDate}
                  onChange={(e) => setAuthorDate(e.target.value)}
                  type="date"
                  className={inputClass}
                />
              </Labeled>

              {/* Lede */}
              <Labeled label="Lede" hint="Bold subtitle under the title.">
                <input
                  value={lede}
                  onChange={(e) => setLede(e.target.value)}
                  className={inputClass}
                />
              </Labeled>

              {/* SEO */}
              <div className="space-y-3 rounded-lg border border-[#ECECEC] p-4">
                <SectionHeader title="SEO & Search" />
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
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder={title || "Defaults to title"}
                    className={inputClass}
                  />
                </Labeled>
                <Labeled label="SEO description" hint="Defaults to the excerpt.">
                  <textarea
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    rows={2}
                    placeholder={description || "Defaults to excerpt"}
                    className={inputClass}
                  />
                </Labeled>
              </div>

              {/* Featured / Carousel */}
              <div className="space-y-3 rounded-lg border border-[#ECECEC] p-4">
                <SectionHeader title="Featured Carousel" />
                <label className="flex items-center gap-3 rounded-lg border border-[#ECECEC] p-3 transition-colors hover:bg-[#FAFAFA]">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="h-5 w-5 rounded border-[#DBDBDB] text-[#FF8A7A] focus:ring-[#FF8A7A]"
                  />
                  <div>
                    <span className="block text-sm font-medium">Feature in carousel</span>
                    <span className="block text-xs text-[#9A9A9A]">Show this post in the homepage carousel</span>
                  </div>
                </label>
                <Labeled label="Carousel intro" hint="Auto-filled from lede/excerpt if blank.">
                  <textarea
                    value={carouselIntro}
                    onChange={(e) => setCarouselIntro(e.target.value)}
                    rows={2}
                    className={inputClass}
                  />
                </Labeled>
                <Labeled label="Carousel body" hint="Auto-filled from the excerpt if blank.">
                  <textarea
                    value={carouselBody}
                    onChange={(e) => setCarouselBody(e.target.value)}
                    rows={3}
                    className={inputClass}
                  />
                </Labeled>
              </div>

              {/* Call to action */}
              <div className="space-y-3 rounded-lg border border-[#ECECEC] p-4">
                <SectionHeader title="Call to Action" />
                <Labeled label="Button label" hint="Leave blank for no CTA.">
                  <input
                    value={ctaLabel}
                    onChange={(e) => setCtaLabel(e.target.value)}
                    placeholder="Try energiebee for free"
                    className={inputClass}
                  />
                </Labeled>

                {/* internal / external toggle */}
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

            </div>
          </aside>
        </>
      )}
    </form>
  );
}
