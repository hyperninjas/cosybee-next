"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";
import { Alert, Spinner, toast } from "@heroui/react";
import type { PartialBlock } from "@blocknote/core";
import { savePost } from "@/app/(private)/admin/actions";
import {
  initialSaveState,
  type EntitySaveState,
} from "@/app/(private)/admin/lib/form-state";
import type { AdminPost } from "@/app/(private)/admin/lib/api";
import { useUnsavedChangesWarning } from "@/app/hooks/useUnsavedChangesWarning";
import {
  PLACEHOLDER_COVER,
  type Author,
  type Category,
  type Tag,
} from "@/app/lib/article-types";
import { PublicImageUpload } from "@/app/components/storage/PublicImageUpload";
import {
  findContentImagesMissingAlt,
  findContentImageUrls,
} from "@/app/lib/content-images";
import { collectPostIssues, type ImageFacts } from "@/app/lib/post-issues";
import { findMediaByUrl } from "@/app/lib/storage";
import type { LinkTarget } from "@/app/lib/link-targets";
import TagInput from "./TagInput";
import { ActionBar, type PostStatus } from "./ActionBar";
import { PublishIssuesDialog } from "./PublishIssuesDialog";
import { AuthorPickerCard } from "./AuthorPickerCard";
import { CategoryPickerCard } from "./CategoryPickerCard";
import { CoverImageCard } from "./CoverImageCard";
import { CtaCard } from "./CtaCard";
import { FeaturedCarouselCard } from "./FeaturedCarouselCard";
import { HomeFeaturedCard } from "./HomeFeaturedCard";
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
  // Null on a draft that hasn't been attributed or filed yet. The pickers
  // start empty and the post cannot be published until both are chosen.
  author: Author | null;
  category: Category | null;
  tags: Tag[];

  // Media — optional (a post can be coverless; the form normalises null → "").
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

  // Display
  readTime: number;
  authorDate: string | null;

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
  status: PostStatus;
  publishedAt?: string | null;

  // Content
  contentJson: Record<string, unknown> | null;
};

/**
 * Identity of the post as the server last knows it. Starts as the post being
 * edited (absent for a new one) and is replaced by whatever each successful
 * save returns — that is what turns a just-created post into an edit.
 */
type SavedRecord = {
  id: string;
  blog: string;
  slug: string;
  status: PostStatus;
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
  /** Pages + published articles offered by the internal link pickers. */
  linkTargets?: LinkTarget[];
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
            } else if (block && typeof block === "object" && "items" in block) {
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

/**
 * Size a textarea to fit its content — the "auto then scrollHeight" two-step
 * is what lets it SHRINK as well as grow (measuring without resetting first
 * only ever reports the current, already-expanded height).
 *
 * `"use no memo"` opts this out of the React Compiler. Under
 * `compilationMode: "all"` the compiler injects a `useMemoCache` hook into
 * every top-level function; this one is called from a ref callback and an
 * effect — neither is a render context — where that hook throws
 * "Invalid hook call".
 */
function fitToContent(el: HTMLTextAreaElement): void {
  "use no memo";
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

/**
 * Turn the schedule picker's `"YYYY-MM-DDTHH:mm"` into an absolute instant.
 *
 * MUST happen in the browser. That string carries no timezone, and JavaScript
 * resolves such a string against whatever process parses it — so doing this in
 * the server action interpreted the author's wall-clock time as the SERVER's
 * timezone. With the app on UTC and an author on BST, a post scheduled for
 * 14:30 was stored as 14:30Z, i.e. 15:30 to the author: an hour in the future,
 * so `publishedAt <= now` stayed false and the post never went live.
 *
 * Worse, it compounded. The editor renders the stored instant in the BROWSER's
 * timezone (correctly), so each save re-read 15:30, re-parsed it as 15:30Z,
 * and pushed the time an hour later again — a published post could drift into
 * the future and quietly unpublish itself.
 *
 * In winter the two zones agree and nothing looks wrong, which is why this
 * only ever misbehaved "sometimes".
 */
function localDateTimeToInstant(value: string): string {
  if (!value) return "";
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? "" : parsed.toISOString();
}

export default function PostForm({
  post,
  defaultBlog,
  categories = [],
  tagSuggestions = [],
  authors = [],
  linkTargets = [],
}: Props) {
  const [state, formAction, isPending] = useActionState<
    EntitySaveState<AdminPost>,
    FormData
  >(savePost, initialSaveState);
  const errors = state?.fieldErrors ?? {};
  const initialBlocks = parseInitialBlocks(post?.contentJson);

  const [saved, setSaved] = useState<SavedRecord | undefined>(
    post && {
      id: post.id,
      blog: post.blog,
      slug: post.slug,
      status: post.status,
    },
  );

  const statusRef = useRef<HTMLInputElement>(null);

  // ── Content ─────────────────────────────────────────────────────────
  const [blocks, setBlocks] = useState<PartialBlock[]>(initialBlocks);
  const [title, setTitle] = useState(post?.title ?? "");
  const titleRef = useRef<HTMLTextAreaElement | null>(null);

  // Re-measure the title on every edit.
  //
  // This USED to live in the textarea's inline ref callback, relying on the
  // callback being a new function each render so React would re-invoke it.
  // The React Compiler (compilationMode: "all") hoists that closure to a
  // stable module-level function, and React only calls a ref callback whose
  // identity changed — so the height was measured once, on mount, against an
  // empty box. Typing a title longer than one line then ran into
  // `.post-title { overflow: hidden }` and the text was clipped out of sight.
  //
  // An effect keyed on the value is immune to that: it re-runs whenever the
  // title changes, however the component happens to be compiled.
  useEffect(() => {
    if (titleRef.current) fitToContent(titleRef.current);
  }, [title]);
  const [description, setDescription] = useState(post?.description ?? "");
  const [lede, setLede] = useState(post?.lede ?? "");

  // ── Slug + routing ──────────────────────────────────────────────────
  const [blog, setBlog] = useState(post?.blog ?? defaultBlog ?? "hive");
  // The slug is the author's to choose. It used to shadow the title until
  // someone edited it, which meant the URL of a post nobody had thought about
  // was whatever the headline happened to say at the moment of saving. It is
  // now plain state: empty until filled in, by hand or by the
  // "Generate from title" button in PostDetailsCard.
  const [slug, setSlug] = useState(post?.slug ?? "");

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

  /**
   * Move the post to the other blog, dropping the category with it.
   *
   * Categories are scoped per blog (`Category.@@unique([blog, slug])`), so a
   * category chosen under Hive does not exist under Learn. Carrying the id
   * across made the save fail outright — the backend's `resolveCategoryId`
   * rejects an id whose blog doesn't match — while the picker, which only
   * lists this blog's categories, showed an empty box and gave no clue why.
   * Clearing it states the truth: moving blogs means choosing a category
   * again.
   *
   * A wrapper rather than an effect on `blog`, which would also fire on mount
   * and wipe the category the post was loaded with.
   */
  const changeBlog = (next: string) => {
    if (next === blog) return;
    setBlog(next);
    setCategoryId("");
    setCategoryName("");
  };

  // TagInput owns the canonical tag state (+ hidden input); this mirror exists
  // only so tag edits register in the unsaved-changes snapshot below.
  const [tagNames, setTagNames] = useState<string[]>(
    post?.tags?.map((t) => t.name) ?? [],
  );

  // ── Cover image ─────────────────────────────────────────────────────
  // Treat the listing placeholder as "no cover" so the editor shows an empty
  // dropzone (and re-saving clears it) rather than the bee-flower stand-in.
  const [coverUrl, setCoverUrl] = useState(
    post?.coverImage && post.coverImage !== PLACEHOLDER_COVER
      ? post.coverImage
      : "",
  );
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
    // Slice the date out of the stored ISO string rather than parsing it: the
    // byline is a CALENDAR DATE, and routing it through a Date only creates an
    // opportunity for a timezone to shift it.
    if (post?.authorDate) return post.authorDate.slice(0, 10);
    // "Today" means the author's today. `toISOString()` would give the UTC
    // day, so anyone east of UTC editing after their evening cutover — 06:00
    // in Dhaka, 01:00 in London — was offered yesterday's date.
    return new Date().toLocaleDateString("en-CA"); // en-CA renders YYYY-MM-DD
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
  const [homeFeatured, setHomeFeatured] = useState(post?.homeFeatured ?? false);
  const [carouselIntro, setCarouselIntro] = useState(post?.carouselIntro ?? "");
  const [carouselBody, setCarouselBody] = useState(post?.carouselBody ?? "");

  // ── CTA ─────────────────────────────────────────────────────────────
  const [ctaLabel, setCtaLabel] = useState(post?.ctaLabel ?? "");
  const [ctaHref, setCtaHref] = useState(post?.ctaHref ?? "");
  const [ctaExternal, setCtaExternal] = useState(post?.ctaExternal ?? false);
  const [ctaEnabled, setCtaEnabled] = useState(Boolean(post?.ctaLabel));

  // Every content image must carry alt text or the backend rejects the save.
  // This is the one HARD blocker — it disables the save buttons outright.
  const missingAlts = useMemo(
    () => findContentImagesMissingAlt(blocks as unknown[]),
    [blocks],
  );

  // Byte size + dimensions of every image in the post, keyed by URL. Two
  // sources feed it: the upload widgets and the editor report a file the
  // browser just handled, and the effect below looks up everything that was
  // already in the post when it opened.
  // Every URL whose size has been settled — measured by the browser or looked
  // up in the registry, hit or miss. Makes each URL a one-shot: the effect
  // below re-runs on every keystroke and must not re-query what it has seen.
  const measuredImages = useRef(new Set<string>());
  const [imageMeta, setImageMeta] = useState<
    Record<string, { name?: string; bytes?: number; width?: number; height?: number }>
  >({});
  const recordImageMeta = useCallback(
    (meta: {
      url: string;
      name?: string;
      bytes?: number;
      width?: number;
      height?: number;
    }) => {
      const { url, ...rest } = meta;
      // The browser measured this file itself, so the registry lookup below
      // has nothing to add — and must not run, since a row with a null size
      // would otherwise overwrite a number we already know.
      measuredImages.current.add(url);
      // Merged, not replaced: a later partial report can fill gaps but never
      // erase a dimension that is already known.
      setImageMeta((prev) => ({ ...prev, [url]: { ...prev[url], ...rest } }));
    },
    [],
  );

  const blocksJson = useMemo(() => JSON.stringify(blocks), [blocks]);

  // Images already in the post when it loaded — a cover set months ago, body
  // images from the original draft — were never handled by this browser, so
  // nothing reported their size. The media registry knows it, so ask.
  const documentImageUrls = useMemo(
    () => findContentImageUrls(blocks as unknown[]),
    [blocks],
  );
  useEffect(() => {
    const pending = [coverUrl, ogImage, ...documentImageUrls].filter(
      (url) => url && !measuredImages.current.has(url),
    );
    if (pending.length === 0) return;
    for (const url of pending) measuredImages.current.add(url);

    let cancelled = false;
    void Promise.all(
      pending.map(async (url) => {
        // A miss is normal (external URL, or a file uploaded outside the
        // library) and simply leaves that image unchecked.
        const item = await findMediaByUrl(url).catch(() => null);
        if (cancelled || !item || item.kind !== "image") return;
        recordImageMeta({
          url,
          name: item.name ?? undefined,
          bytes: item.sizeBytes ?? undefined,
          width: item.width ?? undefined,
          height: item.height ?? undefined,
        });
      }),
    );
    return () => {
      cancelled = true;
    };
  }, [coverUrl, ogImage, documentImageUrls, recordImageMeta]);

  // Advisory pre-publish checks. Never block — they surface in a dialog on
  // Publish/Update and the author is free to go ahead anyway.
  const issues = useMemo(() => {
    const images: ImageFacts[] = [];
    const seen = new Set<string>();
    const add = (slot: ImageFacts["slot"], url: string) => {
      const meta = imageMeta[url];
      if (!url || seen.has(url) || !meta) return;
      seen.add(url);
      images.push({ slot, url, ...meta });
    };
    add("cover", coverUrl);
    add("og", ogImage);
    // Body images: only those still present in the document. An image the
    // author uploaded and then deleted shouldn't keep nagging.
    for (const url of Object.keys(imageMeta)) {
      if (blocksJson.includes(url)) add("content", url);
    }
    return collectPostIssues({
      images,
      // A live post changing address is worth saying out loud: the old URL
      // keeps working via a redirect, but anything that hard-codes it (a
      // newsletter, a printed QR code) now takes an extra hop.
      movedFrom:
        saved &&
        saved.status === "PUBLISHED" &&
        (saved.blog !== blog || saved.slug !== slug)
          ? { blog: saved.blog, slug: saved.slug }
          : undefined,
      coverUrl,
      coverImageAlt,
      description,
      categoryId,
      categoryName,
      tags: tagNames,
      seoTitle,
      seoDescription,
    });
  }, [
    imageMeta,
    blocksJson,
    coverUrl,
    ogImage,
    coverImageAlt,
    description,
    categoryId,
    categoryName,
    tagNames,
    seoTitle,
    seoDescription,
    saved,
    blog,
    slug,
  ]);

  // Warn before leaving with unsaved edits. We snapshot every controlled field
  // (+ the editor content) and compare against the first render's snapshot;
  // any difference means the form is dirty. Disabled while a save is in flight
  // so the post-save redirect isn't blocked. (Tag edits, owned by TagInput's
  // own state, aren't covered by this snapshot.)
  const snapshot = JSON.stringify({
    title,
    description,
    lede,
    blog,
    slug,
    status,
    authorId,
    authorName,
    authorAvatarUrl,
    categoryId,
    categoryName,
    coverUrl,
    coverImageAlt,
    coverImageTitle,
    coverImageCaption,
    coverImageCredit,
    authorDate,
    seoTitle,
    seoDescription,
    ogImage,
    ogImageAlt,
    canonicalUrl,
    noindex,
    publishedAt,
    featured,
    homeFeatured,
    carouselIntro,
    carouselBody,
    ctaLabel,
    ctaHref,
    ctaExternal,
    ctaEnabled,
    tags: tagNames,
    blocks,
  });
  // Capture the first render's snapshot as the baseline (lazy state init runs
  // once); reading state during render is allowed, reading a ref isn't. A
  // successful save moves the baseline forward — see below.
  const [initialSnapshot, setInitialSnapshot] = useState(snapshot);
  useUnsavedChangesWarning(snapshot !== initialSnapshot && !isPending);

  // What was in the form when the save was submitted. The success effect
  // rebases on this rather than on the live snapshot, so anything typed while
  // the save was in flight still counts as unsaved.
  const submittedSnapshot = useRef(snapshot);

  // Saving keeps the author in the editor rather than bouncing to the
  // dashboard, so everything the old redirect used to settle happens here:
  // adopt the record the action just wrote (a brand-new post learns its id,
  // and the action bar switches from Publish to Update), move the
  // unsaved-changes baseline forward so the browser stops warning about edits
  // that are now on the server, and say so with a toast.
  //
  // `firedFor` guards it: an effect keyed on `state` re-runs on React's
  // development double-invoke, which would stack two toasts per save.
  const firedFor = useRef<typeof state | null>(null);
  useEffect(() => {
    if (!state.ok || !state.entity || firedFor.current === state) return;
    firedFor.current = state;
    const entity = state.entity;
    const wasPublished = saved?.status === "PUBLISHED";
    setSaved({
      id: entity.id,
      blog: entity.blog,
      slug: entity.slug,
      status: entity.status,
    });
    setInitialSnapshot(submittedSnapshot.current);
    const href = `/${entity.blog}/${entity.slug}`;
    toast.success(
      entity.status === "PUBLISHED"
        ? wasPublished
          ? "Post updated"
          : "Post published"
        : entity.status === "ARCHIVED"
          ? "Post archived"
          : "Draft saved",
      entity.status === "PUBLISHED"
        ? {
            actionProps: {
              children: "View post",
              onPress: () => window.open(href, "_blank", "noopener"),
            },
          }
        : undefined,
    );
  }, [state, saved]);

  const liveHref =
    saved?.status === "PUBLISHED" ? `/${saved.blog}/${saved.slug}` : undefined;

  /**
   * Arm the next submit with a publication change — or with none.
   *
   * `""` means "save, don't touch publication", and the local `status` state
   * is deliberately left alone for it: the chip should keep showing what the
   * post actually is, and the form must post an empty `status` so the action
   * omits the field entirely.
   */
  function setStatusForSubmit(s: string) {
    if (s) setStatus(s as PostStatus);
    if (statusRef.current) statusRef.current.value = s;
  }

  // Publishing with open issues goes through the dialog once. `bypassIssues`
  // is what the dialog's confirm button flips before re-submitting the form,
  // so the second pass sails through instead of reopening the dialog.
  const formRef = useRef<HTMLFormElement>(null);
  const [issuesOpen, setIssuesOpen] = useState(false);
  const bypassIssues = useRef(false);

  function publishAnyway() {
    bypassIssues.current = true;
    formRef.current?.requestSubmit();
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={(e) => {
        // The BlockNote toolbar renders <button>s that portal INSIDE this form
        // (into `.bn-container`). A <button> with no explicit type defaults to
        // type="submit", so clicking e.g. Bold would submit the post instead of
        // formatting. Swallow any submit whose submitter lives in the editor;
        // real saves come from the ActionBar, which is outside `.bn-container`.
        const submitter = (e.nativeEvent as SubmitEvent).submitter;
        if (submitter instanceof Element && submitter.closest(".bn-container")) {
          e.preventDefault();
          return;
        }
        // Only a save that leaves the post LIVE is worth interrupting.
        // `statusRef` already holds what the pressed button wrote in its
        // onPress, which runs before this — and an empty value now means "no
        // status change", so an update to an already-published post has to
        // count too. Archiving and draft saves go straight through.
        const requested = statusRef.current?.value ?? "";
        const willBeLive =
          requested === "PUBLISHED" || (requested === "" && status === "PUBLISHED");
        if (willBeLive && issues.length > 0 && !bypassIssues.current) {
          e.preventDefault();
          setIssuesOpen(true);
          return;
        }
        bypassIssues.current = false;
        submittedSnapshot.current = snapshot;
      }}
    >
      {/* Hidden inputs — every editable field needs one so a stable
          field set reaches the server action regardless of what the
          drawer/cards happen to be showing. */}
      {saved && <input type="hidden" name="id" value={saved.id} />}
      {/* The address the post currently occupies on the server. The action
          revalidates it when the post moves, so the page cached at the old
          URL doesn't keep serving instead of the new redirect. */}
      {saved && (
        <>
          <input type="hidden" name="previousBlog" value={saved.blog} />
          <input type="hidden" name="previousSlug" value={saved.slug} />
        </>
      )}
      <input type="hidden" name="coverImage" value={coverUrl} />
      <input type="hidden" name="contentJson" value={blocksJson} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="blog" value={blog} />
      <input type="hidden" name="readTime" value="" />
      {/* Empty by default — a status only rides along when a button that
          changes publication armed it. See `setStatusForSubmit`. */}
      <input ref={statusRef} type="hidden" name="status" defaultValue="" />
      {/* Author + category.
          These fields are sent ONLY when they carry a real instruction. The
          backend treats "field present" as "field changed" and resolves a bare
          NAME by upserting a record with it, so a form that always posted
          `authorName`/`category` was re-resolving the taxonomy on every single
          update. With the pickers empty that meant the fallback literals below
          were written as data: the post was silently reassigned to an author
          called "energiebee" and a category called "Uncategorised".

          An id is safe to send at any time — it names an existing record. A
          NAME is only ever an instruction to create one, so it is limited to
          the create path, where a post genuinely has no taxonomy yet and the
          backend requires one of the two. On update, omitting both is what
          says "leave the author/category exactly as they are". */}
      {authorId && <input type="hidden" name="authorId" value={authorId} />}
      {!saved && !authorId && (
        <>
          <input
            type="hidden"
            name="authorName"
            value={authorName || "energiebee"}
          />
          <input
            type="hidden"
            name="authorAvatarUrl"
            value={authorAvatarUrl}
          />
        </>
      )}
      {categoryId && (
        <input type="hidden" name="categoryId" value={categoryId} />
      )}
      {!saved && !categoryId && (
        <input
          type="hidden"
          name="category"
          value={categoryName || "Uncategorised"}
        />
      )}
      <input type="hidden" name="authorDate" value={authorDate} />
      <input type="hidden" name="description" value={description} />
      <input type="hidden" name="coverImageAlt" value={coverImageAlt} />
      <input type="hidden" name="lede" value={lede} />
      <input type="hidden" name="seoTitle" value={seoTitle} />
      <input type="hidden" name="seoDescription" value={seoDescription} />
      <input type="hidden" name="featured" value={featured ? "on" : ""} />
      <input
        type="hidden"
        name="homeFeatured"
        value={homeFeatured ? "on" : ""}
      />
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
      {/* Sent as an ABSOLUTE instant, converted here in the browser — see
          `localDateTimeToInstant`. */}
      <input
        type="hidden"
        name="publishedAt"
        value={localDateTimeToInstant(publishedAt)}
      />

      <ActionBar
        editing={Boolean(saved)}
        status={status}
        blog={blog}
        setBlog={changeBlog}
        onSetStatus={setStatusForSubmit}
        liveHref={liveHref}
        disabled={missingAlts.length > 0}
        hasIssues={issues.length > 0}
      />

      <PublishIssuesDialog
        isOpen={issuesOpen}
        onOpenChange={setIssuesOpen}
        issues={issues}
        confirmLabel={
          saved?.status === "PUBLISHED" ? "Update anyway" : "Publish anyway"
        }
        onConfirm={publishAnyway}
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

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        {/* Writing canvas */}
        <div className="min-w-0 flex-1">
          <div className="mx-auto max-w-2xl">
            <div className="mb-6">
              <PublicImageUpload
                context="blog-cover"
                library
                value={coverUrl || null}
                onChange={(url) => setCoverUrl(url ?? "")}
                onPickFromLibrary={(m) => {
                  // Fill from the asset only when it has the value; keep typed text otherwise.
                  if (m.alt) setCoverImageAlt(m.alt);
                  if (m.title) setCoverImageTitle(m.title);
                  if (m.caption) setCoverImageCaption(m.caption);
                  if (m.credit) setCoverImageCredit(m.credit);
                }}
                onImageMeta={recordImageMeta}
                alt={coverImageAlt || title}
                previewHeight="h-60"
              />
            </div>

            {/* Auto-grow title textarea so long titles don't get clipped. */}
            <textarea
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              // Mount-time sizing stays here on purpose: a ref callback runs
              // BEFORE paint, so opening a post whose title already wraps
              // never flashes at one row the way a post-paint effect would.
              // The effect above owns every measurement after that.
              ref={(el) => {
                titleRef.current = el;
                if (el) fitToContent(el);
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
                /{blog}/{slug || "…"}
              </span>
            </div>

            <div className="mb-6">
              <TagInput
                name="tags"
                initial={tagNames}
                suggestions={tagSuggestions}
                onChange={setTagNames}
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
                      Select{" "}
                      {missingAlts.map((m, i) => (
                        <span key={m.index}>
                          {i > 0 && ", "}image #{m.index}
                        </span>
                      ))}{" "}
                      in the editor below and use the <strong>Alt text</strong>{" "}
                      button to describe it. Captions are optional; alt text is
                      what screen readers and search engines read.
                    </Alert.Description>
                  </Alert.Content>
                </Alert>
              </div>
            )}

            <div className="post-editor">
              <Editor
                initialContent={initialBlocks}
                onChange={setBlocks}
                onImageMeta={recordImageMeta}
                linkTargets={linkTargets}
                currentPath={slug ? `/${blog}/${slug}` : undefined}
              />
            </div>
          </div>
        </div>

        {/* Settings panel — docked beside the editor on lg+. */}
        <aside className="w-full shrink-0 self-start overflow-hidden lg:sticky lg:top-42 lg:max-h-[calc(100vh-12.9rem)] lg:w-104 lg:overflow-y-auto px-2">
          {/* <div className="sticky top-0 z-10 border-b border-border bg-surface px-5 py-4 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.08)]">
            <h2 className="text-lg font-bold text-foreground">Post settings</h2>
          </div> */}

          <div className="space-y-5 pb-5 rounded-2xl">
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
              onImageMeta={recordImageMeta}
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
              slug={slug}
              postId={post?.id}
              title={title}
              slugError={errors.slug}
              description={description}
              setDescription={setDescription}
              setSlug={setSlug}
              authorDate={authorDate}
              setAuthorDate={setAuthorDate}
              lede={lede}
              setLede={setLede}
            />

            <SeoCard
              blog={blog}
              title={title}
              description={description}
              slug={slug}
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
              coverImage={coverUrl}
              onImageMeta={recordImageMeta}
            />

            <ScheduleCard
              publishedAt={publishedAt}
              setPublishedAt={setPublishedAt}
              status={status}
            />

            <FeaturedCarouselCard
              featured={featured}
              setFeatured={setFeatured}
              carouselIntro={carouselIntro}
              setCarouselIntro={setCarouselIntro}
              carouselBody={carouselBody}
              setCarouselBody={setCarouselBody}
            />

            <HomeFeaturedCard
              homeFeatured={homeFeatured}
              setHomeFeatured={setHomeFeatured}
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
              internalRoutes={linkTargets.map((t) => t.path)}
            />
          </div>
        </aside>
      </div>
    </form>
  );
}
