/**
 * Google video sitemap document builder.
 *
 * Kept out of the route handler so the XML is a pure function of a list of
 * articles: testable on its own, and reusable if the catalogue ever needs
 * splitting into a sitemap index (see MAX_SITEMAP_URLS).
 *
 * Spec: https://developers.google.com/search/docs/crawling-indexing/sitemaps/video-sitemaps
 */

import type { Article } from "./article-types";
import { resolveArticleVideos, type ResolvedArticleVideo } from "./article-videos";
import { SITE_URL } from "./site";

/** Google's cap for a single sitemap file. Beyond this, split into an index. */
export const MAX_SITEMAP_URLS = 50_000;

/** Escape a string for inclusion in XML text content. */
function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * `video:publication_date` must be a W3C datetime. Article dates are already
 * ISO strings; anything unparseable is omitted rather than guessed — the field
 * is optional, and a wrong date is worse than an absent one.
 */
function w3cDate(iso: string): string | null {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function videoXml(video: ResolvedArticleVideo): string {
  const lines = [
    `      <video:thumbnail_loc>${escapeXml(video.thumbnailUrl)}</video:thumbnail_loc>`,
    `      <video:title>${escapeXml(video.title)}</video:title>`,
    `      <video:description>${escapeXml(video.description)}</video:description>`,
  ];
  // At least one of these is present — `resolveArticleVideos` guarantees it.
  // Both are emitted when both are known, which is what Google prefers.
  if (video.contentUrl) {
    lines.push(
      `      <video:content_loc>${escapeXml(video.contentUrl)}</video:content_loc>`,
    );
  }
  if (video.embedUrl) {
    lines.push(
      `      <video:player_loc>${escapeXml(video.embedUrl)}</video:player_loc>`,
    );
  }
  const published = w3cDate(video.uploadDate);
  if (published) {
    lines.push(`      <video:publication_date>${published}</video:publication_date>`);
  }
  lines.push(`      <video:family_friendly>yes</video:family_friendly>`);
  lines.push(`      <video:live>no</video:live>`);
  return `    <video:video>\n${lines.join("\n")}\n    </video:video>`;
}

export interface VideoSitemap {
  xml: string;
  /** Pages listed — i.e. articles that actually contain a describable video. */
  urlCount: number;
  /** Total `<video:video>` entries across those pages. */
  videoCount: number;
}

/**
 * Build the video sitemap for a set of articles.
 *
 * Articles with no describable video produce no `<url>` entry at all. That is
 * the point of a video sitemap: a `<url>` that names no video reads to Search
 * Console as a malformed entry, not as "this page has none".
 */
export function buildVideoSitemap(articles: Article[]): VideoSitemap {
  const entries: string[] = [];
  let videoCount = 0;

  for (const article of articles) {
    const videos = resolveArticleVideos(article);
    if (videos.length === 0) continue;
    videoCount += videos.length;
    const loc = `${SITE_URL}/${article.blog}/${article.slug}`;
    entries.push(
      `  <url>\n    <loc>${escapeXml(loc)}</loc>\n${videos
        .map(videoXml)
        .join("\n")}\n  </url>`,
    );
  }

  const body = entries.length ? `\n${entries.join("\n")}\n` : "\n";
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">${body}</urlset>`;

  return { xml, urlCount: entries.length, videoCount };
}
