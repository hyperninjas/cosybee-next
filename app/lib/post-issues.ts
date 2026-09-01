// Pre-publish checks for the post editor.
//
// These are WARNINGS, never blocks: the author sees them in a dialog when they
// press Publish/Update and may publish anyway. The one true blocker — content
// images without alt text — is deliberately NOT here; it disables the save
// buttons outright (see PostForm) because the backend rejects those posts.
//
// Image sizes are only known for images added during the current editing
// session: the browser sees the byte size of a file it just uploaded, and the
// media library reports it for a picked asset. Reopen a post later and its
// images carry no size until one is replaced. That is a deliberate trade —
// checking older images would mean a size lookup the API doesn't offer yet.

/** Where an image sits in the post. Each slot has its own targets. */
export type ImageSlot = "cover" | "og" | "content";

export interface ImageGuidance {
  label: string;
  /** Widest source that is ever useful, in CSS pixels. */
  maxWidth: number;
  /** File size above which the image is worth flagging. */
  maxBytes: number;
  /** Slots a platform expects at exact dimensions (social cards). */
  exact?: { width: number; height: number };
  /** Why this number — shown in the dialog's reference list. */
  note: string;
}

/**
 * Recommended ceilings per slot.
 *
 * The widths come from what this site actually renders, doubled for retina:
 *   - cover   — `sizes="(min-width: 800px) 800px, 100vw"` in ArticleDetail → 800 × 2
 *   - content — the prose column is `max-w-225` (900px) less padding → ~850 × 2
 *   - og      — 1200 × 630 is what our own generator (`/api/og`) emits, and the
 *               size Facebook, X, LinkedIn, Slack and WhatsApp all expect.
 *
 * The byte targets follow current web-performance guidance: hero images under
 * ~400 KB, in-article images under ~200 KB, and social cards comfortably under
 * 1 MB (WhatsApp refuses to fetch above 600 KB).
 */
export const IMAGE_GUIDANCE: Record<ImageSlot, ImageGuidance> = {
  cover: {
    label: "Cover image",
    maxWidth: 1600,
    maxBytes: 400 * 1024,
    note: "Renders at 800px wide, so 1600px covers retina screens.",
  },
  content: {
    label: "Content image",
    maxWidth: 1600,
    maxBytes: 200 * 1024,
    note: "The article column is ~850px wide, so 1600px covers retina screens.",
  },
  og: {
    label: "Social share image",
    maxWidth: 1200,
    maxBytes: 1024 * 1024,
    exact: { width: 1200, height: 630 },
    note: "1200 × 630 is what Facebook, X, LinkedIn and Slack all expect.",
  },
};

/** What we know about one image in the post. Size fields are optional. */
export interface ImageFacts {
  slot: ImageSlot;
  url: string;
  /** Filename or a short label, for naming the image in the dialog. */
  name?: string;
  bytes?: number;
  width?: number;
  height?: number;
}

export interface PostIssue {
  /** Stable within one render — used as the list key. */
  id: string;
  title: string;
  detail: string;
}

function formatBytes(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;
}

/** "cover.jpg" → cover.jpg; a bare URL → its last path segment. */
function imageName(img: ImageFacts): string {
  if (img.name) return img.name;
  try {
    const last = new URL(img.url).pathname.split("/").filter(Boolean).pop();
    return last ?? img.url;
  } catch {
    return img.url;
  }
}

function imageIssues(img: ImageFacts): PostIssue[] {
  const guide = IMAGE_GUIDANCE[img.slot];
  const out: PostIssue[] = [];
  const name = imageName(img);

  if (img.bytes != null && img.bytes > guide.maxBytes) {
    out.push({
      id: `${img.slot}-bytes-${img.url}`,
      title: `${guide.label} is ${formatBytes(img.bytes)} — ${name}`,
      detail: `Recommended under ${formatBytes(guide.maxBytes)}. Heavy images are the usual reason an article feels slow on a phone.`,
    });
  }

  if (img.width == null) return out;

  if (guide.exact) {
    const off =
      img.width !== guide.exact.width ||
      (img.height != null && img.height !== guide.exact.height);
    if (off) {
      const actual = img.height
        ? `${img.width} × ${img.height}`
        : `${img.width}px wide`;
      out.push({
        id: `${img.slot}-dimensions-${img.url}`,
        title: `${guide.label} is ${actual} — ${name}`,
        detail: `Recommended exactly ${guide.exact.width} × ${guide.exact.height}. Other ratios get cropped differently by each platform, and anything under 600 × 315 is shown as a small thumbnail.`,
      });
    }
    return out;
  }

  if (img.width > guide.maxWidth) {
    out.push({
      id: `${img.slot}-width-${img.url}`,
      title: `${guide.label} is ${img.width}px wide — ${name}`,
      detail: `Recommended max ${guide.maxWidth}px. ${guide.note} Anything wider is downloaded in full and then scaled away.`,
    });
  }

  return out;
}

export interface PostIssueInput {
  /** Images currently in the post whose size the session knows. */
  images: ImageFacts[];
  coverUrl: string;
  coverImageAlt: string;
  description: string;
  categoryId: string;
  categoryName: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
}

/**
 * Everything worth mentioning before a post goes live, in the order an author
 * would want to fix it: images first (they affect readers), then the fields
 * that affect how the post is found and shared.
 */
export function collectPostIssues(input: PostIssueInput): PostIssue[] {
  const issues: PostIssue[] = input.images.flatMap(imageIssues);

  if (!input.coverUrl.trim()) {
    issues.push({
      id: "no-cover",
      title: "No cover image",
      detail:
        "The article lists and the social card fall back to a generic image.",
    });
  } else if (!input.coverImageAlt.trim()) {
    issues.push({
      id: "no-cover-alt",
      title: "Cover image has no alt text",
      detail:
        "Screen readers announce the filename instead, and search engines get nothing to read.",
    });
  }

  if (!input.description.trim()) {
    issues.push({
      id: "no-description",
      title: "No description",
      detail:
        "One is generated from the opening paragraph, which rarely reads like a summary.",
    });
  }

  if (!input.categoryId && !input.categoryName.trim()) {
    issues.push({
      id: "no-category",
      title: "No category",
      detail: "The post won't appear under any category listing.",
    });
  }

  if (input.tags.length === 0) {
    issues.push({
      id: "no-tags",
      title: "No tags",
      detail: "Tags drive the related-articles links at the foot of the post.",
    });
  }

  if (!input.seoTitle.trim()) {
    issues.push({
      id: "no-seo-title",
      title: "No SEO title",
      detail: "Search results and the browser tab fall back to the headline.",
    });
  }

  if (!input.seoDescription.trim()) {
    issues.push({
      id: "no-seo-description",
      title: "No SEO description",
      detail: "Google writes its own snippet when this is empty.",
    });
  }

  return issues;
}
