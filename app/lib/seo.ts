import type { Metadata } from "next";
import { coverKeyForPath } from "./og-covers";
import {
  SITE_NAME,
  SITE_TAGLINE,
  TWITTER_HANDLE,
  RSS_ALTERNATE_TYPES,
} from "./site";

/**
 * Centralised page-metadata builder — the ONE place that assembles Open Graph
 * and Twitter card tags for every page.
 *
 * Why this exists: Next.js merges metadata between segments *shallowly*. A page
 * that exports its own `openGraph` (even just to set `url`/`title`) **replaces**
 * the root layout's `openGraph` wholesale — silently dropping `og:image`,
 * `og:site_name`, `og:locale`, etc. Hand-maintaining the full block on every
 * page is error-prone (which is exactly how most pages ended up with no
 * `og:image`). Instead, pages pass their unique bits to `pageMetadata()` and
 * get a complete, consistent block back. Change the defaults here once and
 * every page follows.
 *
 * The root layout (app/layout.tsx) keeps its own inline metadata as the global
 * fallback for any page that doesn't call this (e.g. auth pages).
 */

type OgImage = { url: string; width?: number; height?: number; alt?: string };

/**
 * Bare social-share image: the on-brand 1200×630 card served by the /api/og
 * route handler with no page copy, so it falls back to the site tagline. Used
 * by the root layout for pages that never call `pageMetadata()` (e.g. auth).
 * Pages that do call it get {@link ogImageFor} instead. It's a route (not the `app/opengraph-image.tsx` file
 * convention) on purpose — file-based metadata outranks `generateMetadata`, so
 * a root convention would override per-page `og:image` (e.g. article covers).
 * As a metadata default it can be overridden per page. `metadataBase` (root
 * layout) resolves the relative URL to an absolute one for crawlers.
 */
export const DEFAULT_OG_IMAGE: OgImage = {
  url: "/api/og",
  width: 1200,
  height: 630,
  alt: `${SITE_NAME} — ${SITE_TAGLINE}`,
};

/**
 * Per-page social card — the same /api/og template with the page's own
 * headline, subtitle and hero cover passed as query params. Without this every
 * static page shared one card showing the site tagline, so /solar, /privacy and
 * the home page were indistinguishable in a link preview.
 */
function ogImageFor(
  title: string,
  description: string,
  path: string,
): OgImage {
  const cover = coverKeyForPath(path);
  const query = new URLSearchParams({
    t: title,
    d: description,
    ...(cover ? { bg: cover } : {}),
  });
  return {
    url: `/api/og?${query.toString()}`,
    width: 1200,
    height: 630,
    alt: title,
  };
}

export type PageMetaInput = {
  /** Page title. The brand suffix (" — EnergieBee") is appended automatically
   *  to the OG/Twitter title; the <title> tag gets it from the root template. */
  title: string;
  /** Meta description (full length, for search snippets). */
  description: string;
  /** Canonical path — also used for og:url. e.g. "/solar". */
  path: string;
  /** Optional punchier copy for social cards. Defaults to `description`. */
  ogDescription?: string;
  /** Social image. Defaults to the shared OG card, rendered with this page's
   *  own title and description. */
  image?: OgImage;
  /** og:type. Defaults to "website". */
  type?: "website" | "article" | "profile";
  /** Page-specific meta keywords (replaces the site defaults for this page). */
  keywords?: string[];
  /** false → noindex (links still followed). Defaults to indexable. */
  index?: boolean;
  /** Use `title` verbatim for the <title> tag (skip the brand template). */
  absoluteTitle?: boolean;
};

export function pageMetadata({
  title,
  description,
  path,
  ogDescription,
  image,
  type = "website",
  keywords,
  index = true,
  absoluteTitle = false,
}: PageMetaInput): Metadata {
  // OG/Twitter titles don't pick up the root `title.template`, so brand them
  // here — unless the caller already passed a full, absolute title.
  const socialTitle = absoluteTitle ? title : `${title} — ${SITE_NAME}`;
  const socialDescription = ogDescription ?? description;
  // The card draws the EnergieBee logo above the headline, so it takes the
  // unbranded title — `socialTitle`'s " — EnergieBee" suffix would say the
  // brand twice and push longer titles onto an extra line.
  const socialImage = image ?? ogImageFor(title, socialDescription, path);

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates: { canonical: path, types: RSS_ALTERNATE_TYPES },
    ...(index ? {} : { robots: { index: false, follow: true } }),
    openGraph: {
      type,
      locale: "en_GB",
      siteName: SITE_NAME,
      url: path,
      title: socialTitle,
      description: socialDescription,
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
      title: socialTitle,
      description: socialDescription,
      images: [socialImage.url],
    },
  };
}
