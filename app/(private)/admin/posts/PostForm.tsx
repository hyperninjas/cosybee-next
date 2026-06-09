"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  Alert,
  Button,
  Chip,
  Input,
  ListBox,
  ListBoxItem,
  Select,
  Spinner,
  Switch,
  TextArea,
} from "@heroui/react";
import {
  ArrowLeft,
  ArrowUpRightFromSquare,
  CircleCheckFill,
} from "@gravity-ui/icons";
import type { PartialBlock } from "@blocknote/core";
import { savePost } from "@/app/(private)/admin/actions";
import { initialSaveState } from "@/app/(private)/admin/lib/form-state";
import { slugify } from "@/app/lib/slug";
import { estimateReadTime } from "@/app/lib/read-time";
import TagInput from "./TagInput";
import type { Author, Category, Tag } from "@/app/lib/article-types";
import { PublicImageUpload } from "@/app/components/storage/PublicImageUpload";
import { AppAvatar } from "@/app/components/ui/AppAvatar";
import { AppLink } from "@/app/components/ui/AppLink";

const Editor = dynamic(() => import("./Editor"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center gap-2 py-6 text-sm text-muted">
      <Spinner size="sm" />
      Loading editor…
    </div>
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
      <span className="mb-1 block text-sm font-semibold text-foreground">
        {label}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs font-medium text-danger">
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-muted">{hint}</span>
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
      <span className="text-sm font-semibold text-foreground">{title}</span>
      {action}
    </div>
  );
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
          ? "border-accent bg-accent-soft ring-1 ring-accent"
          : "border-border bg-surface hover:border-border hover:bg-background"
      }`}
    >
      <AppAvatar
        src={author.avatarUrl}
        name={author.name}
        size="md"
        className="shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">
          {author.name}
        </div>
        {author.role && (
          <div className="truncate text-xs text-muted">{author.role}</div>
        )}
      </div>
      {selected && (
        <CircleCheckFill className="size-5 shrink-0 text-accent" />
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
          ? "border-accent bg-accent text-accent-foreground"
          : "border-border bg-surface text-muted hover:border-accent hover:text-accent"
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
  liveHref,
}: {
  editing: boolean;
  isPublished: boolean;
  blog: string;
  setBlog: (b: string) => void;
  onSetStatus: (s: string) => void;
  liveHref?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <div className="sticky top-0 z-30 -mx-4 mb-6 flex items-center justify-between gap-3 border-b border-border bg-surface/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="flex items-center gap-3">
        <AppLink
          href="/admin"
          className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Posts</span>
        </AppLink>
        <Select
          aria-label="Blog"
          selectedKey={blog}
          onSelectionChange={(k) => setBlog(String(k))}
        >
          <Select.Trigger className="w-28">
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBoxItem id="hive">Hive</ListBoxItem>
              <ListBoxItem id="learn">Learn</ListBoxItem>
            </ListBox>
          </Select.Popover>
        </Select>
        <Chip
          color={isPublished ? "success" : "default"}
          size="sm"
          variant="soft"
          className="hidden sm:inline-flex"
        >
          {isPublished ? "Published" : "Draft"}
        </Chip>
      </div>

      <div className="flex items-center gap-2">
        {liveHref && (
          <AppLink
            href={liveHref}
            external
            className="hidden items-center gap-1 text-sm text-muted transition-colors hover:text-foreground sm:inline-flex"
          >
            View live
            <ArrowUpRightFromSquare className="size-3.5" />
          </AppLink>
        )}
        <Button
          type="submit"
          variant="outline"
          size="sm"
          onPress={() => onSetStatus("DRAFT")}
          isDisabled={pending}
          isPending={pending && !isPublished}
        >
          Save draft
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          onPress={() => onSetStatus("PUBLISHED")}
          isDisabled={pending}
          isPending={pending && isPublished}
        >
          {editing && isPublished ? "Update" : "Publish"}
        </Button>
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
        liveHref={liveHref}
      />

      {state?.error && (
        <div className="mx-auto mb-6 max-w-2xl">
          <Alert status="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description>{state.error}</Alert.Description>
            </Alert.Content>
          </Alert>
        </div>
      )}

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Writing canvas */}
        <div className="min-w-0 flex-1">
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
              className="post-title w-full resize-none border-none bg-transparent font-extrabold tracking-tight text-foreground placeholder:text-muted focus:outline-none"
            />
            {errors.title && (
              <p className="mb-2 text-sm font-medium text-danger">
                {errors.title}
              </p>
            )}

            {/* meta line */}
            <div className="mb-4 text-xs text-muted">
              <span className="font-mono">
                /{blog}/{effectiveSlug || "…"}
              </span>
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
        </div>

        {/* Settings panel — always docked beside the editor */}
        <aside className="w-full shrink-0 self-start overflow-hidden rounded-xl border border-border bg-surface lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:w-104 lg:overflow-y-auto">
          <div className="sticky top-0 z-10 border-b border-border bg-surface px-5 py-4">
            <h2 className="text-lg font-bold text-foreground">Post settings</h2>
          </div>

          <div className="space-y-5 p-5">
            {/* Cover Image - FIRST */}
            <div className="space-y-3 rounded-lg border border-border p-4">
              <SectionHeader title="Cover image" />
              <PublicImageUpload
                context="blog-cover"
                value={coverUrl || null}
                onChange={(url) => setCoverUrl(url ?? "")}
              />
              <Labeled
                label="Alt text"
                hint="Describes the image for accessibility. Defaults to the title."
              >
                <Input
                  variant="secondary"
                  fullWidth
                  value={coverImageAlt}
                  onChange={(e) => setCoverImageAlt(e.target.value)}
                  placeholder={title || "Enter alt text…"}
                />
              </Labeled>
            </div>

            {/* Author section - SECOND */}
            <div className="space-y-4 rounded-lg border border-border p-4">
              <SectionHeader
                title="Author"
                action={
                  <span className="text-xs text-muted">
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
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-surface px-2 text-xs text-muted">
                    or create new
                  </span>
                </div>
              </div>

              {/* New author input */}
              <div className="space-y-3">
                <Labeled label="Name" hint="Type a new author name.">
                  <Input
                    variant="secondary"
                    fullWidth
                    value={authorId ? "" : authorName}
                    onChange={(e) => {
                      setAuthorId("");
                      setAuthorName(e.target.value);
                    }}
                    placeholder="New author name…"
                  />
                </Labeled>
                <Labeled
                  label="Avatar"
                  hint="Profile picture for new author (max 2MB)."
                >
                  <PublicImageUpload
                    context="user-avatar"
                    value={authorId ? null : authorAvatarUrl || null}
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
                <div className="rounded-lg bg-background p-3">
                  <span className="mb-2 block text-xs font-medium text-muted">
                    Selected
                  </span>
                  <div className="flex items-center gap-3">
                    <AppAvatar
                      src={authorAvatarUrl}
                      name={authorName || "?"}
                      size="sm"
                    />
                    <span className="text-sm font-medium text-foreground">
                      {authorName || "Unknown"}
                    </span>
                    {authorId && (
                      <Chip
                        color="success"
                        size="sm"
                        variant="soft"
                        className="ml-auto"
                      >
                        Existing
                      </Chip>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Category section - THIRD */}
            <div className="space-y-3 rounded-lg border border-border p-4">
              <SectionHeader
                title="Category"
                action={
                  <span className="text-xs text-muted">
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
              <Input
                variant="secondary"
                fullWidth
                value={categoryName}
                onChange={(e) => handleCategoryChange(e.target.value)}
                placeholder={
                  blogCategories.length > 0
                    ? "Or type a new category…"
                    : "Enter category name…"
                }
              />
            </div>

            {/* Excerpt */}
            <Labeled
              label="Excerpt"
              hint="Card blurb + meta description. Auto from the body if blank."
            >
              <TextArea
                variant="secondary"
                fullWidth
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </Labeled>

            {/* Slug */}
            <Labeled
              label="Slug"
              error={errors.slug}
              hint="Auto from the title. Edit to override."
            >
              <Input
                variant="secondary"
                fullWidth
                className="font-mono"
                value={effectiveSlug}
                onChange={(e) => {
                  setSlug(slugify(e.target.value));
                  setSlugTouched(true);
                }}
              />
              <span className="mt-1 block text-xs text-muted">
                /{blog}/{effectiveSlug || "…"}
              </span>
            </Labeled>

            {/* Author date */}
            <Labeled label="Author date" hint="Defaults to today.">
              <Input
                variant="secondary"
                fullWidth
                value={authorDate}
                onChange={(e) => setAuthorDate(e.target.value)}
                type="date"
              />
            </Labeled>

            {/* Lede */}
            <Labeled label="Lede" hint="Bold subtitle under the title.">
              <Input
                variant="secondary"
                fullWidth
                value={lede}
                onChange={(e) => setLede(e.target.value)}
              />
            </Labeled>

            {/* SEO */}
            <div className="space-y-3 rounded-lg border border-border p-4">
              <SectionHeader title="SEO & Search" />
              {/* Google SERP preview — keeps Google's signature colours */}
              <div className="rounded-md border border-border p-2.5">
                <div className="text-xs text-[#1a6b2f]">
                  energiebee.com › {blog} › {effectiveSlug || "…"}
                </div>
                <div className="leading-tight text-[#1a0dab]">
                  {truncate(metaTitle, 60)}
                </div>
                <div className="mt-0.5 text-xs text-[#4d5156]">
                  {truncate(metaDesc || "Add a description…", 150)}
                </div>
              </div>
              <Labeled label="SEO title" hint="Defaults to the title.">
                <Input
                  variant="secondary"
                  fullWidth
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder={title || "Defaults to title"}
                />
              </Labeled>
              <Labeled label="SEO description" hint="Defaults to the excerpt.">
                <TextArea
                  variant="secondary"
                  fullWidth
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  rows={2}
                  placeholder={description || "Defaults to excerpt"}
                />
              </Labeled>
            </div>

            {/* Featured / Carousel */}
            <div className="space-y-3 rounded-lg border border-border p-4">
              <SectionHeader title="Featured Carousel" />
              <div className="rounded-lg border border-border p-3 transition-colors hover:bg-background">
                <Switch isSelected={featured} onChange={setFeatured}>
                  <Switch.Content>
                    <span className="block text-sm font-medium text-foreground">
                      Feature in carousel
                    </span>
                    <span className="block text-xs text-muted">
                      Show this post in the homepage carousel
                    </span>
                  </Switch.Content>
                </Switch>
              </div>
              <Labeled
                label="Carousel intro"
                hint="Auto-filled from lede/excerpt if blank."
              >
                <TextArea
                  variant="secondary"
                  fullWidth
                  value={carouselIntro}
                  onChange={(e) => setCarouselIntro(e.target.value)}
                  rows={2}
                />
              </Labeled>
              <Labeled
                label="Carousel body"
                hint="Auto-filled from the excerpt if blank."
              >
                <TextArea
                  variant="secondary"
                  fullWidth
                  value={carouselBody}
                  onChange={(e) => setCarouselBody(e.target.value)}
                  rows={3}
                />
              </Labeled>
            </div>

            {/* Call to action */}
            <div className="space-y-3 rounded-lg border border-border p-4">
              <SectionHeader title="Call to Action" />
              <Labeled label="Button label" hint="Leave blank for no CTA.">
                <Input
                  variant="secondary"
                  fullWidth
                  value={ctaLabel}
                  onChange={(e) => setCtaLabel(e.target.value)}
                  placeholder="Try energiebee for free"
                />
              </Labeled>

              {/* internal / external toggle */}
              <div className="inline-flex gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant={!ctaExternal ? "primary" : "outline"}
                  onPress={() => setCtaExternal(false)}
                >
                  Internal page
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={ctaExternal ? "primary" : "outline"}
                  onPress={() => setCtaExternal(true)}
                >
                  External link
                </Button>
              </div>

              {ctaExternal ? (
                <Labeled
                  label="External URL"
                  hint="Opens in a new tab. https:// is added if you omit it."
                >
                  <Input
                    variant="secondary"
                    fullWidth
                    type="url"
                    value={ctaHref}
                    onChange={(e) => setCtaHref(e.target.value)}
                    placeholder="https://example.com"
                  />
                </Labeled>
              ) : (
                <Labeled
                  label="Internal page"
                  hint="Search an existing page. Opens in the same tab."
                >
                  <Input
                    variant="secondary"
                    fullWidth
                    className="font-mono"
                    value={ctaHref}
                    onChange={(e) => setCtaHref(e.target.value)}
                    placeholder="/start"
                    list="route-options"
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
      </div>
    </form>
  );
}
