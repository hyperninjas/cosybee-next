"use client";

import {
  startTransition,
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
import {
  savePost,
  createDraft,
  autosavePost,
  discardStagedChanges,
  type AutosavePatch,
} from "@/app/(private)/admin/actions";
import { useAutosave } from "./useAutosave";
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
} from "@/app/lib/article-types";
import { PublicImageUpload } from "@/app/components/storage/PublicImageUpload";
import {
  findContentImagesMissingAlt,
  findContentImageUrls,
} from "@/app/lib/content-images";
import { collectPostIssues, type ImageFacts } from "@/app/lib/post-issues";
import { findMediaByUrl } from "@/app/lib/storage";
import type { LinkTarget } from "@/app/lib/link-targets";
import { inter } from "@/app/lib/fonts";
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
  /**
   * The post's tag NAMES — which is all the form works in. It used to take
   * `Tag[]` and immediately throw away everything but the name, which meant a
   * caller with only names (a staged autosave patch stores them that way) had
   * to fabricate ids to satisfy the type.
   */
  tagNames: string[];

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
  /** Set when the post is already live and holding edits nobody has seen. */
  draftUpdatedAt?: string | null;

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

  /**
   * Publication change the next submit should carry — `""` for none.
   *
   * A plain ref, NOT a hidden form field. It was one, written imperatively by
   * the action bar on press, and it kept arriving empty: whether that value
   * reaches the serialised form depends on the button's type, on React Aria's
   * press timing against the browser's native submit, and on React's own form
   * reset. Publish silently saved a draft. The submit handler now sets this on
   * the FormData itself, where none of that can interfere.
   */
  const requestedStatusRef = useRef("");

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
  /**
   * What the post ACTUALLY is, straight from the last saved record.
   *
   * Derived, never set optimistically. It used to be state that the action bar
   * wrote on press — so pressing Publish flipped it to PUBLISHED before
   * anything was saved, and if the submit was then blocked or failed, the
   * primary button re-labelled itself to "Update". Pressing that sent NO
   * status at all (Update means "leave publication alone"), so the post saved
   * as a draft and the toast said so, with the button still claiming
   * otherwise. The intent for the next submit lives in `requestedStatusRef`;
   * this is
   * only ever the truth.
   */
  const status: PostStatus = (saved?.status as PostStatus | undefined) ?? "DRAFT";

  // Edits a live post is holding back. Seeded from the record and kept in step
  // with what autosave reports, so the bar appears the moment work is staged.
  const [hasStaged, setHasStaged] = useState(Boolean(post?.draftUpdatedAt));
  const [stagedBusy, setStagedBusy] = useState(false);


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
    post?.tagNames ?? [],
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
  /**
   * What this post still needs before it can go live.
   *
   * These used to be filled in behind the author's back — an unattributed post
   * was quietly assigned an author called "energiebee" and a category called
   * "Uncategorised". Nothing invents them now, which is right, but it means
   * the backend refuses to publish without them. Saying so here turns an
   * opaque save failure into something actionable before the request is made.
   *
   * Advisory issues (no cover, thin description) stay in the dialog — these
   * are the ones that actually stop the post going live.
   */
  const missingToPublish = useMemo(() => {
    const missing: string[] = [];
    if (!title.trim()) missing.push("a title");
    if (!authorId) missing.push("an author");
    if (!categoryId) missing.push("a category");
    return missing;
  }, [title, authorId, categoryId]);

  /** "a title, an author and a category" — read out, not comma-spliced. */
  const missingToPublishText =
    missingToPublish.length > 1
      ? `${missingToPublish.slice(0, -1).join(", ")} and ${missingToPublish.at(-1)}`
      : missingToPublish[0];

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
    // Captured once: the Set is created by `useRef(new Set())` and never
    // reassigned, so this is the same object the cleanup needs — and reading
    // it here rather than through `.current` later is what the lint asks for.
    const measured = measuredImages.current;
    for (const url of pending) measured.add(url);

    let cancelled = false;
    // URLs whose lookup actually finished, so the cleanup can tell them apart
    // from ones abandoned mid-flight.
    const settled = new Set<string>();
    void Promise.all(
      pending.map(async (url) => {
        // Three outcomes, and they are not the same thing:
        //
        //  - a row comes back → record what it knows;
        //  - the library genuinely has no such object (an external URL, or a
        //    file uploaded outside the gallery) → leave it marked, so the
        //    lookup isn't repeated on every keystroke;
        //  - the REQUEST failed → unmark it, so a blip doesn't silently
        //    exclude that image from the pre-publish checks for the rest of
        //    the session. It is retried on the next edit.
        const item = await findMediaByUrl(url).catch(() => undefined);
        if (cancelled) return;
        settled.add(url);
        if (item === undefined) {
          measured.delete(url);
          return;
        }
        if (!item || item.kind !== "image") return;
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
      // Release the marks on anything abandoned mid-flight, so a later run
      // asks again.
      //
      // Without this the effect could not survive its own remount. Strict Mode
      // runs it, cleans up, then runs it again: the first pass marked every
      // URL and had its results discarded by `cancelled`, and the second found
      // nothing left to do because they were all marked. Net result, on every
      // post opened for editing: no image facts at all, so `issues` silently
      // skipped every image and the size/dimension warnings never appeared.
      // Only images uploaded during the session — which report themselves
      // through `onImageMeta` — were ever checked.
      for (const url of pending) {
        if (!settled.has(url)) measured.delete(url);
      }
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
  /**
   * The same idea, narrowed to what autosave does NOT keep.
   *
   * Once a post exists, its title, body, cover, SEO, CTA and the rest are
   * saved a few seconds after you stop typing — so warning about them on the
   * way out would cry wolf every single time. These are the fields that really
   * would be lost: the address, publication, and the CTA's on/off toggle.
   *
   * Kept in step with `snapshot` by hand; both baselines move together on a
   * successful save.
   */
  const unautosavedSnapshot = JSON.stringify({
    blog,
    slug,
    status,
    publishedAt,
    ctaEnabled,
  });

  // Capture the first render's snapshot as the baseline (lazy state init runs
  // once); reading state during render is allowed, reading a ref isn't. A
  // successful save moves the baseline forward — see below.
  const [initialSnapshot, setInitialSnapshot] = useState(snapshot);
  const [initialUnautosaved, setInitialUnautosaved] = useState(unautosavedSnapshot);

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
    setInitialUnautosaved(unautosavedSnapshot);
    // An explicit save writes the WHOLE form live, which makes any staged
    // patch stale — it is a subset of what was just published. Leaving it
    // would keep offering "Make changes live" for edits already live, and
    // promoting it later would republish an older body.
    if (hasStaged) {
      setHasStaged(false);
      void discardStagedChanges(entity.id);
    }
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
  }, [state, saved, hasStaged, unautosavedSnapshot]);

  const liveHref =
    saved?.status === "PUBLISHED" ? `/${saved.blog}/${saved.slug}` : undefined;

  // ── Create-on-slug + autosave ───────────────────────────────────────
  //
  // A post used to come into existence only when someone pressed Save, so
  // until then there was nothing to autosave into and an hour of writing lived
  // in one browser tab. It is now created as soon as its address is settled
  // and free, and everything typed after that is kept on its own.

  /** Guards against a second create while the first is still in the air. */
  const creatingRef = useRef(false);

  const [startingDraft, setStartingDraft] = useState(false);

  const startDraft = useCallback(async () => {
    if (saved || creatingRef.current) return;
    creatingRef.current = true;
    setStartingDraft(true);
    try {
      // Seeded with everything on screen. Creating an empty row and letting
      // autosave fill it in meant the author's work only reached the server on
      // the next idle tick — close the tab first and they had a post with
      // nothing in it.
      const result = await createDraft(blog, slug, {
        title,
        contentJson: blocks as unknown[],
        description,
        lede,
        coverImage: coverUrl,
        coverImageAlt,
        coverImageTitle,
        coverImageCaption,
        coverImageCredit,
        seoTitle,
        seoDescription,
        ogImage,
        ogImageAlt,
        canonicalUrl,
        noindex,
        authorDate,
        featured,
        homeFeatured,
        carouselIntro,
        carouselBody,
        ctaLabel,
        ctaHref,
        ctaExternal,
        authorId,
        categoryId,
        tags: tagNames,
      });
      if (!result.ok) {
        // Not fatal — Save draft still creates the post the ordinary way. Say
        // so once rather than blocking the author.
        toast.danger(result.error);
        return;
      }
      setSaved({
        id: result.post.id,
        blog: result.post.blog,
        slug: result.post.slug,
        status: result.post.status,
      });
      // Move the address bar onto the real edit URL without a navigation, so a
      // reload lands on the draft instead of a blank "new post" form.
      window.history.replaceState(null, "", `/admin/posts/${result.post.id}/edit`);
      toast.success("Draft started — it saves itself from here");
    } finally {
      creatingRef.current = false;
      setStartingDraft(false);
    }
  }, [
    blog,
    saved,
    slug,
    title,
    blocks,
    description,
    lede,
    coverUrl,
    coverImageAlt,
    coverImageTitle,
    coverImageCaption,
    coverImageCredit,
    seoTitle,
    seoDescription,
    ogImage,
    ogImageAlt,
    canonicalUrl,
    noindex,
    authorDate,
    featured,
    homeFeatured,
    carouselIntro,
    carouselBody,
    ctaLabel,
    ctaHref,
    ctaExternal,
    authorId,
    categoryId,
    tagNames,
  ]);

  /**
   * Everything autosave keeps, as one flat object.
   *
   * Three groups are deliberately absent:
   *
   *  - `slug` and `blog` — the post's ADDRESS. Moving it retires the old URL
   *    into the redirect table, which is a decision, not a keystroke.
   *  - `status` and `publishedAt` — publication. The backend refuses them on
   *    the autosave route rather than ignoring them.
   * Author, category and tags ARE included, as ids and names respectively. On
   * a draft they land straight in the columns and the backend resolves them
   * like any other save; on a published post they sit in the staged patch, and
   * the edit page resolves them back into records when it reloads.
   */
  const autosaveValue = useMemo(
    () => ({
      title,
      blocks,
      description,
      lede,
      coverImage: coverUrl,
      coverImageAlt,
      coverImageTitle,
      coverImageCaption,
      coverImageCredit,
      seoTitle,
      seoDescription,
      ogImage,
      ogImageAlt,
      canonicalUrl,
      noindex,
      authorDate,
      featured,
      homeFeatured,
      carouselIntro,
      carouselBody,
      ctaLabel,
      ctaHref,
      ctaExternal,
      authorId,
      categoryId,
      tags: tagNames,
    }),
    [
      title,
      blocks,
      description,
      lede,
      coverUrl,
      coverImageAlt,
      coverImageTitle,
      coverImageCaption,
      coverImageCredit,
      seoTitle,
      seoDescription,
      ogImage,
      ogImageAlt,
      canonicalUrl,
      noindex,
      authorDate,
      featured,
      homeFeatured,
      carouselIntro,
      carouselBody,
      ctaLabel,
      ctaHref,
      ctaExternal,
      authorId,
      categoryId,
      tagNames,
    ],
  );

  const autosaveState = useAutosave({
    value: autosaveValue,
    // Nothing to save into until the post exists.
    enabled: Boolean(saved?.id),
    save: async (v, previous) => {
      // Only what actually changed. Every field is compared rather than
      // listed, so adding one to `autosaveValue` is enough — a per-field
      // `if` ladder is exactly the kind of thing that silently stops covering
      // a field somebody added later.
      //
      // It matters most for the body: the server re-renders it to HTML
      // through jsdom on every save, so a request that only moves the title
      // must not carry it. On the first save `previous` is undefined and
      // everything goes.
      const patch: AutosavePatch = {};
      for (const key of Object.keys(v) as (keyof typeof v)[]) {
        // Both handled below: arrays get a content comparison, because a new
        // array with the same items is not a change worth sending.
        if (key === "blocks" || key === "tags") continue;
        if (!previous || v[key] !== previous[key]) {
          (patch as Record<string, unknown>)[key] = v[key];
        }
      }
      if (
        !previous ||
        JSON.stringify(v.tags) !== JSON.stringify(previous.tags)
      ) {
        patch.tags = v.tags;
      }
      // The body is compared by content, not identity: BlockNote hands back a
      // fresh array for changes that leave the document alone (a cursor move),
      // and it is the one field worth a stringify to be sure about.
      if (
        !previous ||
        (v.blocks !== previous.blocks &&
          JSON.stringify(v.blocks) !== JSON.stringify(previous.blocks))
      ) {
        patch.contentJson = v.blocks as unknown[];
      }
      if (Object.keys(patch).length === 0) {
        return { ok: true as const, staged: hasStaged };
      }
      const result = await autosavePost(saved!.id, patch);
      // Set here rather than in an effect on the autosave state: this is an
      // event callback, so it cannot cascade renders the way a synchronous
      // setState inside an effect does.
      if (result.ok && result.staged) setHasStaged(true);
      return result.ok
        ? { ok: true as const, staged: result.staged }
        : { ok: false as const, error: result.error };
    },
  });

  const dropStagedChanges = useCallback(async () => {
    if (!saved) return;
    setStagedBusy(true);
    const result = await discardStagedChanges(saved.id);
    setStagedBusy(false);
    if (!result.ok) {
      toast.danger(result.error ?? "Could not discard the changes.");
      return;
    }
    setHasStaged(false);
    // The editor was seeded with the staged text, so clearing the patch alone
    // would leave the discarded version on screen — and the next keystroke
    // would stage it straight back. Reloading is what actually returns the
    // author to the live article.
    window.location.reload();
  }, [saved]);

  // Warn on the way out only about work that would actually be lost.
  //
  // Before the post exists nothing is saved, so the whole form counts. After
  // that, autosave has the body and most of the metadata — what remains is the
  // narrow snapshot above, plus autosave itself still having work in hand or
  // having failed.
  const autosaveHasWork =
    autosaveState.status === "dirty" ||
    autosaveState.status === "saving" ||
    autosaveState.status === "error";
  useUnsavedChangesWarning(
    !isPending &&
      (saved
        ? unautosavedSnapshot !== initialUnautosaved || autosaveHasWork
        : snapshot !== initialSnapshot),
  );

  /**
   * Arm the next submit with a publication change — or with none.
   *
   * `""` posts an empty status, which the action reads as "leave publication
   * alone" and omits from the payload. Nothing else happens here: the chip and
   * the button labels follow the SAVED record (see `status`), so a submit that
   * never lands cannot leave them describing a post that doesn't exist.
   */
  function setStatusForSubmit(s: string) {
    requestedStatusRef.current = s;
    // Submit HERE rather than letting the button's own `type="submit"` do it.
    //
    // The buttons come from a React Aria press handler, and there is no
    // guarantee `onPress` runs before the browser's native submit — if it
    // loses that race the form is serialised with the PREVIOUS value of this
    // field, which is empty, and the action reads that as "leave publication
    // alone". Pressing Publish then saved a draft. Writing the field and
    // submitting in the same call removes the race instead of betting on it.
    formRef.current?.requestSubmit();
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
      // No `action` prop: the action is dispatched by hand below, so the
      // status can be written onto the FormData rather than smuggled through
      // a hidden field. See `requestedStatusRef`.
      onSubmit={(e) => {
        // Nothing here submits natively — every path ends in `formAction`.
        e.preventDefault();

        // The BlockNote toolbar renders <button>s that portal INSIDE this form
        // (into `.bn-container`). A <button> with no explicit type defaults to
        // type="submit", so clicking e.g. Bold would submit the post instead of
        // formatting. Swallow any submit whose submitter lives in the editor;
        // real saves come from the ActionBar, which is outside `.bn-container`.
        const submitter = (e.nativeEvent as SubmitEvent).submitter;
        if (submitter instanceof Element && submitter.closest(".bn-container")) {
          return;
        }
        // Only a save that leaves the post LIVE is worth interrupting. An
        // empty request means "no status change", so an update to an
        // already-published post counts too. Archiving and draft saves go
        // straight through.
        const requested = requestedStatusRef.current;
        const willBeLive =
          requested === "PUBLISHED" || (requested === "" && status === "PUBLISHED");
        // Stop here rather than letting the backend refuse: it would come back
        // as a save error after a round trip, with the post's own fields the
        // only clue as to what was wrong.
        if (willBeLive && missingToPublish.length > 0) {
          toast.danger(`Add ${missingToPublishText} before publishing.`);
          return;
        }
        if (willBeLive && issues.length > 0 && !bypassIssues.current) {
          setIssuesOpen(true);
          return;
        }
        bypassIssues.current = false;
        submittedSnapshot.current = snapshot;

        // Dispatch with FormData we control. `status` is set HERE, on the
        // object that actually reaches the action — the previous hidden field
        // kept arriving empty, so Publish saved a draft.
        const data = new FormData(e.currentTarget);
        data.set("status", requested);
        startTransition(() => formAction(data));
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
        pending={isPending}
        autosave={autosaveState}
        staged={
          hasStaged && status === "PUBLISHED"
            ? { onDiscard: dropStagedChanges, busy: stagedBusy }
            : null
        }
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
            {missingToPublish.length > 0 && (
              <Alert status="warning">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>
                    Not ready to publish — add {missingToPublishText}
                  </Alert.Title>
                  <Alert.Description>
                    Saving works as normal; only going live needs these.
                  </Alert.Description>
                </Alert.Content>
              </Alert>
            )}
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

            {/* `inter.variable` again (see ArticleDetail): the editor is set
                in the article's reading face so a post looks the same while
                it is written as it does once it publishes. */}
            <div className={`${inter.variable} post-editor`}>
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
              postId={saved?.id}
              title={title}
              slugError={errors.slug}
              description={description}
              setDescription={setDescription}
              setSlug={setSlug}
              startDraft={
                saved ? null : { onStart: startDraft, busy: startingDraft }
              }
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
