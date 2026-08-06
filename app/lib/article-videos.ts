/**
 * Video extraction for article SEO.
 *
 * The article body is authored in BlockNote and persisted as `Post.contentJson`
 * — that JSON document is the source of truth, not the HTML we render from it.
 * So everything here walks the JSON: add or remove a video in the editor, save,
 * and the article's VideoObject JSON-LD, its og:video tags and the video
 * sitemap all follow with no further action. Parsing the exported HTML instead
 * would mean re-deriving structure we already have, from a string that is built
 * per request.
 *
 * Two representations count as "a video in an article":
 *
 *   1. A native BlockNote video block —
 *      `{ type: "video", props: { url, caption, name, previewWidth } }`.
 *      Usually a self-hosted MP4 (transcoded to faststart H.264/AAC on upload),
 *      but authors can paste any URL, so a provider watch link may land here too.
 *
 *   2. A `htmlBlock` (the editor's Custom HTML block) containing an embed —
 *      `{ type: "htmlBlock", props: { html } }`. Iframes are allowlisted to
 *      YouTube / Vimeo / Spotify / Google Maps (see blocknoteSchema.ts); only
 *      the first two are video, and only those produce a video here. A Spotify
 *      player or an embedded map is not a VideoObject and claiming otherwise is
 *      the kind of thing that costs a site its rich results.
 *
 * Blocks nest (multi-column layouts put them under `children`), so the walk is
 * recursive and order-preserving — document order is what the sitemap and the
 * JSON-LD both report.
 *
 * Client-safe: no server-only imports, so the article page, the sitemap route
 * and (if ever needed) the editor can all share it.
 */

import type { Article } from "./article-types";
import { SITE_URL, url as siteUrl } from "./site";

// ── Types ────────────────────────────────────────────────────────────────

export type VideoProvider = "youtube" | "vimeo" | "file";

/** A video found in an article body, before article-level fallbacks. */
export interface ArticleVideo {
  /** 1-based position in document order. Stable for a given document. */
  index: number;
  provider: VideoProvider;
  /**
   * Direct URL of the media file itself (`video:content_loc`). Self-hosted
   * videos only — a provider page is a player, not a file.
   */
  contentUrl: string | null;
  /** URL of a player suitable for iframing (`video:player_loc`). */
  embedUrl: string | null;
  /** Author-supplied caption, if any. */
  caption: string | null;
  /** Original file name, if the block carries one. */
  name: string | null;
  /** Poster URL when the provider exposes a deterministic one. */
  thumbnailUrl: string | null;
}

/**
 * A video with every field Google requires resolved — or it isn't in the list.
 * Both the JSON-LD builder and the video sitemap consume this shape, so the two
 * can't drift into describing the same video differently.
 */
export interface ResolvedArticleVideo extends ArticleVideo {
  /** Non-empty, absolute. */
  thumbnailUrl: string;
  /** Non-empty. */
  title: string;
  /** Non-empty. */
  description: string;
  /** ISO 8601. */
  uploadDate: string;
}

// ── Provider URL parsing ─────────────────────────────────────────────────

/** YouTube ids are 11 chars of the URL-safe base64 alphabet. */
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "youtu.be",
]);

const VIMEO_HOSTS = new Set([
  "vimeo.com",
  "www.vimeo.com",
  "player.vimeo.com",
]);

/** Video file extensions we treat as a directly-playable media file. */
const VIDEO_FILE_EXT = /\.(mp4|m4v|mov|webm|ogv|ogg|mkv|avi|m3u8|mpd)(?:$|\?|#)/i;

function parseUrl(raw: string): URL | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    // Relative media URLs are legal in the document; resolve them against the
    // site so downstream consumers always see something absolute.
    return new URL(trimmed, SITE_URL);
  } catch {
    return null;
  }
}

/**
 * Extract a YouTube video id from any of its URL shapes:
 * `watch?v=`, `youtu.be/`, `/embed/`, `/shorts/`, `/live/`, `/v/`.
 */
export function youTubeId(raw: string): string | null {
  const u = parseUrl(raw);
  if (!u || !YOUTUBE_HOSTS.has(u.hostname.toLowerCase())) return null;

  const fromQuery = u.searchParams.get("v");
  if (fromQuery && YOUTUBE_ID.test(fromQuery)) return fromQuery;

  const segments = u.pathname.split("/").filter(Boolean);
  if (u.hostname.toLowerCase() === "youtu.be") {
    const [id] = segments;
    return id && YOUTUBE_ID.test(id) ? id : null;
  }
  const keyed = ["embed", "shorts", "live", "v"];
  for (let i = 0; i < segments.length - 1; i++) {
    if (keyed.includes(segments[i])) {
      const id = segments[i + 1];
      return YOUTUBE_ID.test(id) ? id : null;
    }
  }
  return null;
}

/** Extract a Vimeo numeric id from `vimeo.com/<id>` or `player.vimeo.com/video/<id>`. */
export function vimeoId(raw: string): string | null {
  const u = parseUrl(raw);
  if (!u || !VIMEO_HOSTS.has(u.hostname.toLowerCase())) return null;
  const segments = u.pathname.split("/").filter(Boolean);
  // player.vimeo.com/video/123456789 → take the segment after "video";
  // vimeo.com/123456789 → the first numeric segment.
  const idx = segments.indexOf("video");
  const candidate = idx >= 0 ? segments[idx + 1] : segments[0];
  return candidate && /^\d+$/.test(candidate) ? candidate : null;
}

/**
 * Classify a URL into the provider shape we can describe to search engines.
 * Returns null for anything that isn't a video — audio embeds, maps, images,
 * and provider pages we can't build a player URL for.
 */
function classify(raw: string): Pick<
  ArticleVideo,
  "provider" | "contentUrl" | "embedUrl" | "thumbnailUrl"
> | null {
  const yt = youTubeId(raw);
  if (yt) {
    return {
      provider: "youtube",
      contentUrl: null,
      embedUrl: `https://www.youtube.com/embed/${yt}`,
      // `hqdefault` is the one derivative YouTube generates for every video.
      // `maxresdefault` is sharper but 404s on anything never uploaded above
      // 720p — and a thumbnail that 404s fails the rich result outright.
      thumbnailUrl: `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`,
    };
  }

  const vimeo = vimeoId(raw);
  if (vimeo) {
    return {
      provider: "vimeo",
      contentUrl: null,
      embedUrl: `https://player.vimeo.com/video/${vimeo}`,
      // Vimeo posters live behind an oEmbed lookup, so there's no URL we can
      // derive offline. Falls back to the article's cover during resolution.
      thumbnailUrl: null,
    };
  }

  const u = parseUrl(raw);
  if (!u) return null;
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  if (!VIDEO_FILE_EXT.test(u.pathname)) return null;

  return {
    provider: "file",
    contentUrl: u.toString(),
    embedUrl: null,
    thumbnailUrl: null,
  };
}

// ── Document walking ─────────────────────────────────────────────────────

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

/**
 * Pull every iframe/video source out of a raw HTML string.
 *
 * Deliberately a scan rather than a DOM parse: this runs in the same server
 * render as the page and in the sitemap route, and the markup it reads has
 * already been through DOMPurify's allowlist on save. We only need the `src`
 * attributes, and the shapes that produce them are `<iframe src>`,
 * `<video src>` and `<video><source src>`.
 */
function htmlMediaSources(html: string): string[] {
  const out: string[] = [];
  const tag = /<(iframe|video|source)\b([^>]*)>/gi;
  for (const match of html.matchAll(tag)) {
    const src = /\bsrc\s*=\s*("([^"]*)"|'([^']*)'|([^\s">]+))/i.exec(match[2]);
    const value = src?.[2] ?? src?.[3] ?? src?.[4];
    if (value) out.push(value);
  }
  return out;
}

/** The root block array, accepting both persisted shapes plus a JSON string. */
function toBlocks(contentJson: unknown): unknown[] {
  let data = contentJson;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return [];
    }
  }
  if (Array.isArray(data)) return data;
  if (isRecord(data) && Array.isArray(data["blocks"])) {
    return data["blocks"] as unknown[];
  }
  return [];
}

/**
 * Every video in an article body, in document order, deduplicated by target.
 *
 * The same clip embedded twice on one page is one video as far as a video
 * sitemap is concerned — listing it twice under the same `<loc>` is a
 * duplicate-entry warning, not extra coverage.
 */
export function extractArticleVideos(contentJson: unknown): ArticleVideo[] {
  const found: ArticleVideo[] = [];
  const seen = new Set<string>();

  const add = (
    rawUrl: string | null,
    caption: string | null,
    name: string | null,
  ): void => {
    if (!rawUrl) return;
    const classified = classify(rawUrl);
    if (!classified) return;
    // Key on what the video actually points at, so the same clip reached via
    // a watch URL in one block and an embed URL in another collapses to one.
    const key = classified.embedUrl ?? classified.contentUrl ?? rawUrl;
    if (seen.has(key)) return;
    seen.add(key);
    found.push({
      index: found.length + 1,
      ...classified,
      caption,
      name,
    });
  };

  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }
    if (!isRecord(value)) return;

    const type = typeof value["type"] === "string" ? value["type"] : "";
    const props = isRecord(value["props"]) ? value["props"] : undefined;
    const attrs = isRecord(value["attrs"]) ? value["attrs"] : undefined;

    if (type === "video") {
      // BlockNote stores the source on `props.url`; `attrs.src` covers the
      // TipTap-shaped documents the alt-text walkers also tolerate.
      add(
        str(props?.["url"]) ?? str(attrs?.["src"]) ?? str(value["url"]),
        str(props?.["caption"]) ?? str(attrs?.["title"]),
        str(props?.["name"]),
      );
    } else if (type === "htmlBlock") {
      const html = str(props?.["html"]);
      if (html) for (const src of htmlMediaSources(html)) add(src, null, null);
    }

    // Recurse: `children` holds nested blocks (columns, list nesting),
    // `content` holds inline runs — a raw-HTML string can live in either.
    visit(value["children"]);
    visit(value["content"]);
  };

  visit(toBlocks(contentJson));
  return found;
}

/** Does this article body contain at least one video? Cheap pre-filter. */
export function hasArticleVideos(contentJson: unknown): boolean {
  return extractArticleVideos(contentJson).length > 0;
}

// ── Resolution against the article ───────────────────────────────────────

/** Resolve a possibly-relative asset path to an absolute URL. */
function absolute(pathOrUrl: string): string {
  return /^https?:\/\//i.test(pathOrUrl) ? pathOrUrl : siteUrl(pathOrUrl);
}

/** Collapse whitespace and hard-limit a field to what the spec accepts. */
function clamp(text: string, max: number): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length <= max ? flat : `${flat.slice(0, max - 1).trimEnd()}…`;
}

/** Strip a file extension and separators so `heat-pump_v2.mp4` reads as a title. */
function titleFromFileName(name: string): string {
  return name
    .replace(/\.[^./\\]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Google truncates video titles well before this; keep them short and whole. */
const MAX_TITLE = 100;
/** `video:description` hard limit in Google's video sitemap spec. */
const MAX_DESCRIPTION = 2048;

export interface ResolveVideoOptions {
  /**
   * Supply a real poster for a video the document can't describe on its own —
   * self-hosted files and Vimeo embeds.
   *
   * The media library DOES hold a captured poster (and duration) for every
   * uploaded video, but its API is admin-guarded, so the public render can't
   * read it and the block props don't carry it. Until one of those changes,
   * resolution falls back to the article's cover image. Pass a resolver here
   * to close that gap without touching any consumer.
   */
  posterFor?: (video: ArticleVideo) => string | null | undefined;
}

/**
 * Attach the fields Google requires on every video — title, description,
 * thumbnail, upload date — pulling from the article where the block itself is
 * silent, and DROPPING any video we still can't describe completely.
 *
 * Dropping matters: a VideoObject missing a required property is an invalid
 * rich result, and an entry in a video sitemap without a thumbnail is rejected
 * at parse time. A shorter, correct list beats a complete, broken one.
 */
export function resolveArticleVideos(
  article: Article,
  options: ResolveVideoOptions = {},
): ResolvedArticleVideo[] {
  const videos = extractArticleVideos(article.contentJson);
  if (videos.length === 0) return [];

  // The article's own imagery, used as the stand-in poster. `coverImage` is
  // deliberately NOT used — it falls back to a generic site placeholder, and a
  // stock bee illustration is not a thumbnail of anyone's video.
  const articlePoster = article.coverImageReal ?? article.ogImage ?? null;
  const uploadDate = article.publishedAt ?? article.authorDate ?? null;
  const articleDescription = article.seoDescription ?? article.description ?? "";

  const resolved: ResolvedArticleVideo[] = [];
  for (const video of videos) {
    // Required: at least one of content_loc / player_loc.
    if (!video.contentUrl && !video.embedUrl) continue;
    // Required: a real publication date. Every published article has one.
    if (!uploadDate) continue;

    const poster =
      video.thumbnailUrl ?? options.posterFor?.(video) ?? articlePoster;
    if (!poster) continue;

    const title =
      video.caption ??
      (video.name ? titleFromFileName(video.name) : null) ??
      article.title;
    if (!title.trim()) continue;

    // The caption describes the clip; the article's description is the honest
    // wider context when there is no caption. Title is the last resort so the
    // field is never empty (Google requires it) and never invented.
    const description = video.caption ?? articleDescription ?? title;
    if (!description.trim()) continue;

    resolved.push({
      ...video,
      thumbnailUrl: absolute(poster),
      title: clamp(title, MAX_TITLE),
      description: clamp(description, MAX_DESCRIPTION),
      uploadDate,
    });
  }
  return resolved;
}

// ── Open Graph ───────────────────────────────────────────────────────────

/** MIME types for the file extensions Open Graph consumers actually play. */
const VIDEO_MIME: Record<string, string> = {
  mp4: "video/mp4",
  m4v: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  ogv: "video/ogg",
  ogg: "video/ogg",
};

/** The `og:video:type` for a direct media URL, or undefined if unrecognised. */
function videoMimeType(fileUrl: string): string | undefined {
  const ext = /\.([a-z0-9]+)(?:$|\?|#)/i.exec(fileUrl)?.[1]?.toLowerCase();
  return ext ? VIDEO_MIME[ext] : undefined;
}

/** Shape Next's Metadata API expects under `openGraph.videos`. */
export interface OpenGraphVideo {
  url: string;
  secureUrl?: string;
  type?: string;
}

/**
 * Open Graph video tags for an article's videos.
 *
 * A self-hosted file is advertised as the file itself with its real MIME type;
 * a provider embed is advertised as its player URL with `text/html`, which is
 * what Facebook, LinkedIn and X expect for an embeddable player. `secureUrl` is
 * only set for https sources — that is the whole point of the property, and
 * repeating an http URL into it would be a lie a crawler can check.
 *
 * Returns an empty array for articles with no videos, so callers can spread it
 * and emit nothing at all.
 */
export function openGraphVideos(
  videos: ResolvedArticleVideo[],
): OpenGraphVideo[] {
  const tags: OpenGraphVideo[] = [];
  for (const video of videos) {
    // `resolveArticleVideos` guarantees one of the two is set.
    const target = video.contentUrl ?? video.embedUrl;
    if (!target) continue;
    // A player URL is an embeddable HTML document; a file is its own MIME type.
    const type = video.contentUrl ? videoMimeType(video.contentUrl) : "text/html";
    tags.push({
      url: target,
      ...(target.startsWith("https://") ? { secureUrl: target } : {}),
      ...(type ? { type } : {}),
    });
  }
  return tags;
}
