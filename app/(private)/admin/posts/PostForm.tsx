"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Alert, Spinner } from "@heroui/react";
import type { PartialBlock } from "@blocknote/core";
import { savePost } from "@/app/(private)/admin/actions";
import { initialSaveState } from "@/app/(private)/admin/lib/form-state";
import { slugify } from "@/app/lib/slug";
import type { Author, Category, Tag } from "@/app/lib/article-types";
import { PublicImageUpload } from "@/app/components/storage/PublicImageUpload";
import { findContentImagesMissingAlt } from "@/app/lib/content-images";
import TagInput from "./TagInput";
import { ActionBar, type PostStatus } from "./ActionBar";
import { AuthorPickerCard } from "./AuthorPickerCard";
import { CategoryPickerCard } from "./CategoryPickerCard";
import { CoverImageCard } from "./CoverImageCard";
import { CtaCard } from "./CtaCard";
import { FeaturedCarouselCard } from "./FeaturedCarouselCard";
import { PostDetailsCard } from "./PostDetailsCard";
import { ScheduleCard } from "./ScheduleCard";
import { SeoCard } from "./SeoCard";

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
  coverImageTitle?: string | null;
  coverImageCaption?: string | null;
  coverImageCredit?: string | null;

  // SEO / social
  ogImage?: string | null;
  ogImageAlt?: string | null;
  canonicalUrl?: string | null;
  noindex?: boolean;

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

  // Status / scheduling
  status: PostStatus;
  publishedAt?: string | null;

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

/**
 * Parse the saved contentJson into BlockNote blocks. Handles three shapes:
 * the current `{ blocks: [...] }` wrapper, a raw block array, and a legacy
 * `{ sections: [{ heading, paragraphs, blocks }] }` format from an earlier
 * editor. Returns `[]` on any failure so the editor starts blank instead
 * of crashing.
 */
function parseInitialBlocks(
  contentJson: Record<string, unknown> | null | undefined,
): PartialBlock[] {
  if (!contentJson) return [];
  try {
    const parsed = contentJson;
    if (
      parsed &&
      typeof parsed === "object" &&
      "blocks" in parsed &&
      Array.isArray(parsed.blocks)
    ) {
      return parsed.blocks as PartialBlock[];
    }
    if (Array.isArray(parsed)) {
      return parsed as PartialBlock[];
    }
    if (
      parsed &&
      typeof parsed === "object" &&
      "sections" in parsed &&
      Array.isArray(parsed.sections)
    ) {
      const blocks: PartialBlock[] = [];
      type LegacyBlock = string | { items: string[] };
      type LegacySection = {
        heading?: string;
        paragraphs?: string[];
        blocks?: LegacyBlock[];
      };

      for (const section of parsed.sections as LegacySection[]) {
        if (section.heading) {
          blocks.push({
            type: "heading",
            props: { level: 2 },
            content: [{ type: "text", text: section.heading, styles: {} }],
          });
        }
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
        if (section.blocks && Array.isArray(section.blocks)) {
          for (const block of section.blocks) {
            if (typeof block === "string" && block.trim()) {
              blocks.push({
                type: "paragraph",
                content: [{ type: "text", text: block, styles: {} }],
              });
            } else if (
              block &&
              typeof block === "object" &&
              "items" in block
            ) {
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
  const initialBlocks = parseInitialBlocks(post?.contentJson);

  const statusRef = useRef<HTMLInputElement>(null);

  // ── Content ─────────────────────────────────────────────────────────
  const [blocks, setBlocks] = useState<PartialBlock[]>(initialBlocks);
  const [title, setTitle] = useState(post?.title ?? "");
  const [description, setDescription] = useState(post?.description ?? "");
  const [lede, setLede] = useState(post?.lede ?? "");

  // ── Slug + routing ──────────────────────────────────────────────────
  const [blog, setBlog] = useState(post?.blog ?? defaultBlog ?? "hive");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(post?.slug));
  const effectiveSlug = slugTouched ? slug : slugify(title);

  // ── Status ──────────────────────────────────────────────────────────
  const [status, setStatus] = useState<PostStatus>(post?.status ?? "DRAFT");

  // ── Taxonomy ────────────────────────────────────────────────────────
  const [authorId, setAuthorId] = useState(post?.author?.id ?? "");
  const [authorName, setAuthorName] = useState(post?.author?.name ?? "");
  const [authorAvatarUrl, setAuthorAvatarUrl] = useState(
    post?.author?.avatarUrl ?? "",
  );

  const [categoryId, setCategoryId] = useState(post?.category?.id ?? "");
  const [categoryName, setCategoryName] = useState(post?.category?.name ?? "");
  const blogCategories = categories.filter((c) => c.blog === blog);

  // ── Cover image ─────────────────────────────────────────────────────
  const [coverUrl, setCoverUrl] = useState(post?.coverImage ?? "");
  const [coverImageAlt, setCoverImageAlt] = useState(post?.coverImageAlt ?? "");
  const [coverImageTitle, setCoverImageTitle] = useState(
    post?.coverImageTitle ?? "",
  );
  const [coverImageCaption, setCoverImageCaption] = useState(
    post?.coverImageCaption ?? "",
  );
  const [coverImageCredit, setCoverImageCredit] = useState(
    post?.coverImageCredit ?? "",
  );

  // ── Byline ──────────────────────────────────────────────────────────
  const [authorDate, setAuthorDate] = useState(() => {
    if (post?.authorDate) {
      return new Date(post.authorDate).toISOString().split("T")[0];
    }
    return new Date().toISOString().split("T")[0]; // Default to today
  });

  // ── SEO / social ────────────────────────────────────────────────────
  const [seoTitle, setSeoTitle] = useState(post?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(
    post?.seoDescription ?? "",
  );
  const [ogImage, setOgImage] = useState(post?.ogImage ?? "");
  const [ogImageAlt, setOgImageAlt] = useState(post?.ogImageAlt ?? "");
  const [canonicalUrl, setCanonicalUrl] = useState(post?.canonicalUrl ?? "");
  const [noindex, setNoindex] = useState(post?.noindex ?? false);

  // ── Scheduling — datetime-local "YYYY-MM-DDTHH:mm". Empty = no schedule.
  const [publishedAt, setPublishedAt] = useState(() => {
    if (!post?.publishedAt) return "";
    const d = new Date(post.publishedAt);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });

  // ── Featured / Carousel ─────────────────────────────────────────────
  const [featured, setFeatured] = useState(post?.featured ?? false);
  const [carouselIntro, setCarouselIntro] = useState(post?.carouselIntro ?? "");
  const [carouselBody, setCarouselBody] = useState(post?.carouselBody ?? "");

  // ── CTA ─────────────────────────────────────────────────────────────
  const [ctaLabel, setCtaLabel] = useState(post?.ctaLabel ?? "");
  const [ctaHref, setCtaHref] = useState(post?.ctaHref ?? "");
  const [ctaExternal, setCtaExternal] = useState(post?.ctaExternal ?? false);
  const [ctaEnabled, setCtaEnabled] = useState(Boolean(post?.ctaLabel));

  // Every content image must carry alt text or the backend rejects the save.
  const missingAlts = useMemo(
    () => findContentImagesMissingAlt(blocks as unknown[]),
    [blocks],
  );

  const liveHref =
    post && post.status === "PUBLISHED"
      ? `/${post.blog}/${post.slug}`
      : undefined;

  function setStatusForSubmit(s: string) {
    setStatus(s as PostStatus);
    if (statusRef.current) statusRef.current.value = s;
  }

  const initialTagNames = post?.tags?.map((t) => t.name) ?? [];

  return (
    <form action={formAction}>
      {/* Hidden inputs — every editable field needs one so a stable
          field set reaches the server action regardless of what the
          drawer/cards happen to be showing. */}
      {post && <input type="hidden" name="id" value={post.id} />}
      <input type="hidden" name="coverImage" value={coverUrl} />
      <input type="hidden" name="contentJson" value={JSON.stringify(blocks)} />
      <input type="hidden" name="slug" value={effectiveSlug} />
      <input type="hidden" name="blog" value={blog} />
      <input type="hidden" name="readTime" value="" />
      <input
        ref={statusRef}
        type="hidden"
        name="status"
        defaultValue={status}
      />
      {/* Author — send ID if available, otherwise name + avatar */}
      {authorId && <input type="hidden" name="authorId" value={authorId} />}
      <input
        type="hidden"
        name="authorName"
        value={authorName || "energiebee"}
      />
      <input type="hidden" name="authorAvatarUrl" value={authorAvatarUrl} />
      {/* Category — send ID if available, otherwise name */}
      {categoryId && (
        <input type="hidden" name="categoryId" value={categoryId} />
      )}
      <input
        type="hidden"
        name="category"
        value={categoryName || "Uncategorised"}
      />
      <input type="hidden" name="authorDate" value={authorDate} />
      <input type="hidden" name="description" value={description} />
      <input type="hidden" name="coverImageAlt" value={coverImageAlt} />
      <input type="hidden" name="lede" value={lede} />
      <input type="hidden" name="seoTitle" value={seoTitle} />
      <input type="hidden" name="seoDescription" value={seoDescription} />
      <input type="hidden" name="featured" value={featured ? "on" : ""} />
      <input type="hidden" name="carouselIntro" value={carouselIntro} />
      <input type="hidden" name="carouselBody" value={carouselBody} />
      <input type="hidden" name="ctaLabel" value={ctaEnabled ? ctaLabel : ""} />
      <input type="hidden" name="ctaHref" value={ctaEnabled ? ctaHref : ""} />
      <input
        type="hidden"
        name="ctaExternal"
        value={ctaEnabled && ctaExternal ? "on" : ""}
      />
      <input type="hidden" name="coverImageTitle" value={coverImageTitle} />
      <input type="hidden" name="coverImageCaption" value={coverImageCaption} />
      <input type="hidden" name="coverImageCredit" value={coverImageCredit} />
      <input type="hidden" name="ogImage" value={ogImage} />
      <input type="hidden" name="ogImageAlt" value={ogImageAlt} />
      <input type="hidden" name="canonicalUrl" value={canonicalUrl} />
      <input type="hidden" name="noindex" value={noindex ? "on" : ""} />
      <input type="hidden" name="publishedAt" value={publishedAt} />

      <ActionBar
        editing={Boolean(post)}
        status={status}
        blog={blog}
        setBlog={setBlog}
        onSetStatus={setStatusForSubmit}
        liveHref={liveHref}
        disabled={missingAlts.length > 0}
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
            <div className="mb-6">
              <PublicImageUpload
                context="blog-cover"
                value={coverUrl || null}
                onChange={(url) => setCoverUrl(url ?? "")}
                alt={coverImageAlt || title}
              />
            </div>

            {/* Auto-grow title textarea so long titles don't get clipped. */}
            <textarea
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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

            <div className="mb-4 text-xs text-muted">
              <span className="font-mono">
                /{blog}/{effectiveSlug || "…"}
              </span>
            </div>

            <div className="mb-6">
              <TagInput
                name="tags"
                initial={initialTagNames}
                suggestions={tagSuggestions}
              />
            </div>

            {/* Block the save until every content image carries alt text —
                the backend rejects un-alt'd images with a 400. */}
            {missingAlts.length > 0 && (
              <div className="mb-4">
                <Alert status="warning">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>
                      {missingAlts.length === 1
                        ? "1 image is missing alt text"
                        : `${missingAlts.length} images are missing alt text`}
                    </Alert.Title>
                    <Alert.Description>
                      Add an alt/caption to{" "}
                      {missingAlts.map((m, i) => (
                        <span key={m.index}>
                          {i > 0 && ", "}image #{m.index}
                        </span>
                      ))}{" "}
                      in the editor below before saving.
                    </Alert.Description>
                  </Alert.Content>
                </Alert>
              </div>
            )}

            <div className="post-editor">
              <Editor initialContent={initialBlocks} onChange={setBlocks} />
            </div>
          </div>
        </div>

        {/* Settings panel — docked beside the editor on lg+. */}
        <aside className="w-full shrink-0 self-start overflow-hidden lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:w-104 lg:overflow-y-auto">
          <div className="sticky top-0 z-10 border-b border-border bg-surface px-5 py-4 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.08)]">
            <h2 className="text-lg font-bold text-foreground">Post settings</h2>
          </div>

          <div className="space-y-5 py-5 px-1">
            <CoverImageCard
              title={title}
              coverUrl={coverUrl}
              setCoverUrl={setCoverUrl}
              coverImageAlt={coverImageAlt}
              setCoverImageAlt={setCoverImageAlt}
              coverImageTitle={coverImageTitle}
              setCoverImageTitle={setCoverImageTitle}
              coverImageCaption={coverImageCaption}
              setCoverImageCaption={setCoverImageCaption}
              coverImageCredit={coverImageCredit}
              setCoverImageCredit={setCoverImageCredit}
            />

            <AuthorPickerCard
              authors={authors}
              authorId={authorId}
              authorName={authorName}
              authorAvatarUrl={authorAvatarUrl}
              setAuthorId={setAuthorId}
              setAuthorName={setAuthorName}
              setAuthorAvatarUrl={setAuthorAvatarUrl}
            />

            <CategoryPickerCard
              blog={blog}
              blogCategories={blogCategories}
              categoryId={categoryId}
              setCategoryId={setCategoryId}
              setCategoryName={setCategoryName}
            />

            <PostDetailsCard
              blog={blog}
              effectiveSlug={effectiveSlug}
              slugError={errors.slug}
              description={description}
              setDescription={setDescription}
              setSlug={setSlug}
              setSlugTouched={setSlugTouched}
              authorDate={authorDate}
              setAuthorDate={setAuthorDate}
              lede={lede}
              setLede={setLede}
            />

            <SeoCard
              blog={blog}
              title={title}
              description={description}
              effectiveSlug={effectiveSlug}
              seoTitle={seoTitle}
              setSeoTitle={setSeoTitle}
              seoDescription={seoDescription}
              setSeoDescription={setSeoDescription}
              ogImage={ogImage}
              setOgImage={setOgImage}
              ogImageAlt={ogImageAlt}
              setOgImageAlt={setOgImageAlt}
              coverImageAlt={coverImageAlt}
              canonicalUrl={canonicalUrl}
              setCanonicalUrl={setCanonicalUrl}
              noindex={noindex}
              setNoindex={setNoindex}
            />

            <ScheduleCard
              publishedAt={publishedAt}
              setPublishedAt={setPublishedAt}
            />

            <FeaturedCarouselCard
              featured={featured}
              setFeatured={setFeatured}
              carouselIntro={carouselIntro}
              setCarouselIntro={setCarouselIntro}
              carouselBody={carouselBody}
              setCarouselBody={setCarouselBody}
            />

            <CtaCard
              ctaEnabled={ctaEnabled}
              setCtaEnabled={setCtaEnabled}
              ctaLabel={ctaLabel}
              setCtaLabel={setCtaLabel}
              ctaHref={ctaHref}
              setCtaHref={setCtaHref}
              ctaExternal={ctaExternal}
              setCtaExternal={setCtaExternal}
              internalRoutes={internalRoutes}
            />
          </div>
        </aside>
      </div>
    </form>
  );
}
