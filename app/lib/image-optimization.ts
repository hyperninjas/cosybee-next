/**
 * One source of truth for "can Next's image optimizer handle this URL, and if
 * so at which widths".
 *
 * Two consumers, which MUST agree:
 *
 *  1. `<Image unoptimized={…}>` on article covers (cards, carousel, hero,
 *     sidebar rail, admin list). A cover that opts out is served as the raw
 *     upload — no resize, no AVIF/WebP, no optimizer cache.
 *  2. {@link optimizeArticleImages}, which rewrites the `<img>` tags inside a
 *     rendered article BODY. Those never pass through `next/image` at all (the
 *     body is a server-rendered HTML string — see app/lib/blocknote.ts), so the
 *     same decision has to be reimplemented over raw markup.
 *
 * Both are here so a host added to `remotePatterns` is picked up by covers and
 * body images in one edit.
 */

// ── what the optimizer will accept ──────────────────────────────────────────

/**
 * Hosts the optimizer can actually fetch from, server-side.
 *
 * MIRRORS `images.remotePatterns` in next.config.ts — but deliberately NOT a
 * copy of it. `remotePatterns` also lists `eb-api.technext.it`, which is
 * excluded here: that host can resolve to a private IP, which Next refuses to
 * fetch from the server, so routing it through `/_next/image` yields a broken
 * image rather than a slow one. Config permits it; this list is what we're
 * willing to bet a render on. Adding a host to one means considering the other.
 */
const OPTIMIZABLE_HOSTS: readonly {
  host: string | RegExp;
  /** Mirrors a pattern's `search: ""` — a URL with a query string is rejected. */
  allowSearch: boolean;
}[] = [
  { host: "energiebee.s3.eu-west-2.amazonaws.com", allowSearch: true },
  {
    // Google account photos (better-auth stores the provider URL on
    // `user.image`). The config pins `search: ""` because the size is encoded
    // in the path (…=s96-c), never a query — so a URL that does carry one is
    // refused by the optimizer and has to fall back to the raw src.
    host: /^[^.]+\.googleusercontent\.com$/,
    allowSearch: false,
  },
];

/**
 * Widths `/_next/image` will serve — `imageSizes` followed by `deviceSizes`
 * from next.config.ts, ascending.
 *
 * This ladder is a CLOSED SET: the optimizer rejects anything else outright
 * ("w" parameter (width) of 400 is not allowed → HTTP 400), so a hand-picked
 * width would ship a broken image, not a suboptimal one. Keep in step with the
 * config.
 */
const IMAGE_WIDTHS = [
  16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048,
] as const;

/** Likewise closed: `images.qualities` in next.config.ts. */
const BODY_IMAGE_QUALITY = 75;

/**
 * Whether `/_next/image` can serve this src.
 *
 * `false` means the caller must fall back to the raw URL — as `unoptimized` on
 * an `<Image>`, or by leaving an `<img>` untouched.
 */
export function canOptimizeImage(src: string): boolean {
  if (!src) return false;

  // Inlined bytes are already "the derivative"; there is nothing to fetch.
  if (src.startsWith("data:") || src.startsWith("blob:")) return false;

  // SVG is refused unless `dangerouslyAllowSVG` is set, which it is not — an
  // SVG is a script-execution surface, and article covers/bodies are
  // author-supplied. ("image type is not allowed" → HTTP 400.)
  if (isSvg(src)) return false;

  // Same-origin: /public and /_next/static, both served by us.
  if (src.startsWith("/")) return true;

  if (!/^https?:\/\//i.test(src)) return false;

  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return false;
  }
  return OPTIMIZABLE_HOSTS.some(({ host, allowSearch }) => {
    const matches =
      typeof host === "string" ? host === url.hostname : host.test(url.hostname);
    return matches && (allowSearch || url.search === "");
  });
}

/** The `unoptimized` prop for an `<Image>` — the inverse of the above. */
export function unoptimizedFor(src: string): boolean {
  return !canOptimizeImage(src);
}

/** `.svg`, ignoring any query string or fragment. */
function isSvg(src: string): boolean {
  return /\.svg(?:[?#]|$)/i.test(src);
}

/**
 * The origin worth a `<link rel="preconnect">` for this image, or null.
 *
 * Null for anything the browser will fetch from us — including optimizable
 * remote images, where the cross-origin fetch happens server-side inside
 * `/_next/image` and the browser only ever talks to our origin. Only an image
 * that stays unoptimized costs the reader a third-party DNS + TLS handshake.
 */
export function crossOriginOf(src: string): string | null {
  if (!src || !/^https?:\/\//i.test(src)) return null;
  if (canOptimizeImage(src)) return null;
  try {
    return new URL(src).origin;
  } catch {
    return null;
  }
}

// ── URL building ────────────────────────────────────────────────────────────

/** A `/_next/image` URL. Callers must have checked {@link canOptimizeImage}. */
export function optimizedImageUrl(
  src: string,
  width: number,
  quality: number = BODY_IMAGE_QUALITY,
): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}

/**
 * The ladder rungs worth offering for an image that renders `target` CSS px
 * wide: everything from the first rung that covers 1x up to the first that
 * covers 2x. Narrower rungs are useless (the browser would upscale) and wider
 * ones are bytes no display can resolve.
 */
export function candidateWidths(target: number): number[] {
  const widest = IMAGE_WIDTHS[IMAGE_WIDTHS.length - 1];
  const min = IMAGE_WIDTHS.find((w) => w >= target) ?? widest;
  const max = IMAGE_WIDTHS.find((w) => w >= target * 2) ?? widest;
  return IMAGE_WIDTHS.filter((w) => w >= min && w <= max);
}

// ── article body rewriting ──────────────────────────────────────────────────

/**
 * The article prose column, in CSS px — `max-w-170` on the `.article-body`
 * wrapper in ArticleDetail (170 × 0.25rem = 42.5rem). The widest any body
 * image can render, whatever its intrinsic size, because
 * `.article-body img { max-width: 100% }` caps it (see globals.css).
 */
const ARTICLE_COLUMN_PX = 680;

/**
 * Viewport below which the column stops being fixed-width and the image spans
 * the screen instead. Matches the hero's `sizes` on the same page.
 */
const ARTICLE_COLUMN_BREAKPOINT_PX = 768;

/** `<img …>`, self-closing or not. Attribute values may contain `>`-free text. */
const IMG_TAG = /<img\b([^>]*)>/gi;

/** Pull one double- or single-quoted attribute out of a tag's attribute text. */
function readAttr(attrs: string, name: string): string | null {
  const m = attrs.match(
    new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i"),
  );
  if (!m) return null;
  return m[2] ?? m[3] ?? null;
}

function hasAttr(attrs: string, name: string): boolean {
  return new RegExp(`\\b${name}\\b`, "i").test(attrs);
}

/**
 * Decode the entities an HTML attribute value can legally carry, so the src we
 * hand to `encodeURIComponent` is the real URL. BlockNote's export escapes `&`
 * in query strings, and a media URL with `?v=2&x=1` would otherwise be
 * re-encoded as the literal text "&amp;".
 */
function decodeAttrEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

/** `&` → `&amp;`, so the generated URLs survive being parsed as HTML. */
function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

/**
 * Route the `<img>` tags in a rendered article body through `/_next/image`.
 *
 * WHY THIS EXISTS. The body is authored in BlockNote and rendered to an HTML
 * string by the server exporter, then injected with `dangerouslySetInnerHTML`.
 * There is no React element to swap for an `<Image>`, so every body image
 * arrived as the full-resolution upload — a 1.5MB PNG painted into a 680px
 * column — with no `srcset`, no modern format, and no lazy loading. Rewriting
 * the markup is the only place the optimizer can be reached from.
 *
 * Runs LAST in ArticleDetail's post-processing chain, after `stripPastedColors`
 * and `buildToc`: both walk tags with broad `<[^>]*>`-style patterns, and the
 * long `srcset` this adds is nothing they need to scan.
 *
 * Conservative by design — an `<img>` is left exactly as it was when the host
 * isn't optimizable (see {@link canOptimizeImage}) or when it already carries a
 * `srcset`, so the pass is idempotent and an author pasting a third-party image
 * degrades to today's behaviour rather than to a broken one.
 */
export function optimizeArticleImages(html: string): string {
  if (!html) return html;

  return html.replace(IMG_TAG, (tag, rawAttrs: string) => {
    const attrs = rawAttrs as string;

    // Already responsive (a previous pass, or hand-written markup) — leave it.
    if (hasAttr(attrs, "srcset")) return tag;

    const rawSrc = readAttr(attrs, "src");
    if (!rawSrc) return tag;

    const src = decodeAttrEntities(rawSrc);
    if (!canOptimizeImage(src)) return tag;

    // BlockNote writes `width` from the author's resized preview; it is the
    // real render width and beats the column default. Anything wider than the
    // column is clamped by CSS, so the column is always the ceiling.
    const declared = Number(readAttr(attrs, "width"));
    const target = Math.min(
      Number.isFinite(declared) && declared > 0 ? declared : ARTICLE_COLUMN_PX,
      ARTICLE_COLUMN_PX,
    );

    const widths = candidateWidths(target);
    const srcSet = widths
      .map((w) => `${optimizedImageUrl(src, w)} ${w}w`)
      .join(", ");
    const fallback = optimizedImageUrl(src, widths[widths.length - 1]);
    const sizes = `(min-width: ${ARTICLE_COLUMN_BREAKPOINT_PX}px) ${target}px, 100vw`;

    // Replace src in place so attribute order (and anything we don't know
    // about) is preserved, then append what the tag was missing. The trailing
    // solidus of an XHTML-style `<img … />` has to come off first, or the
    // appended attributes would land after it.
    let next = attrs
      .replace(/\bsrc\s*=\s*("[^"]*"|'[^']*')/i, `src="${escapeAttr(fallback)}"`)
      .replace(/\s*\/\s*$/, "");
    next += ` srcset="${escapeAttr(srcSet)}" sizes="${sizes}"`;
    if (!hasAttr(attrs, "loading")) next += ` loading="lazy"`;
    if (!hasAttr(attrs, "decoding")) next += ` decoding="async"`;

    return `<img${next}>`;
  });
}
