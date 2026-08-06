/**
 * Schema.org structured-data builders (JSON-LD).
 *
 * Pure functions returning plain objects — render them with the <JsonLd>
 * component. Site-wide Organization + WebSite schemas live in the root layout;
 * these cover per-page entities (articles, breadcrumbs, the app, listings).
 *
 * No server-only imports here, so the builders can be used from any component.
 */

import {
  ORG_LEGAL_NAME,
  SITE_NAME,
  SITE_URL,
  SITE_DESCRIPTION,
  url,
} from "./site";
import type { Article } from "./article-types";
import type { ResolvedArticleVideo } from "./article-videos";

/** Resolve a possibly-relative asset path to an absolute URL. */
function absolute(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return url(pathOrUrl);
}

/** BreadcrumbList — pass crumbs in order, root first. */
export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absolute(item.path),
    })),
  };
}

/** BlogPosting for a single article. `path` is the canonical article path. */
export function blogPostingSchema(article: Article, path: string) {
  const publisherLogo = url("/icon");
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.seoTitle ?? article.title,
    description: article.seoDescription ?? article.description,
    image: [absolute(article.coverImage)],
    ...(article.publishedAt ? { datePublished: article.publishedAt } : {}),
    dateModified: article.updatedAt ?? article.publishedAt ?? undefined,
    // Person author (not Organization) — individual authorship is a stronger
    // E-E-A-T signal. Publisher stays the Organization below.
    author: {
      "@type": "Person",
      name: article.author?.name || SITE_NAME,
    },
    publisher: {
      "@type": "Organization",
      name: ORG_LEGAL_NAME,
      logo: { "@type": "ImageObject", url: publisherLogo },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": absolute(path) },
    ...(article.tags.length
      ? { keywords: article.tags.map((t) => t.name).join(", ") }
      : {}),
    articleSection: article.category?.name || undefined,
    url: absolute(path),
  };
}

/**
 * VideoObject for one video embedded in an article.
 *
 * Emitted per video, alongside the article's BlogPosting — Google reads the
 * page's video markup independently of the article markup, and a page with
 * three clips is three VideoObjects, not one with three sources.
 *
 * Every required property (name, description, thumbnailUrl, uploadDate) is
 * guaranteed non-empty by `resolveArticleVideos`, which drops anything it
 * can't describe in full rather than emitting a partial node. `contentUrl` /
 * `embedUrl` are spread-or-omitted: a self-hosted file has the former, a
 * provider embed the latter, and asserting an empty one is worse than silence.
 *
 * @param path Canonical path of the page the video appears on.
 */
export function videoObjectSchema(video: ResolvedArticleVideo, path: string) {
  const pageUrl = absolute(path);
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    // Stable per-video identity on the page, so repeat crawls reconcile the
    // same node instead of treating each render as a new video.
    "@id": `${pageUrl}#video-${video.index}`,
    name: video.title,
    description: video.description,
    thumbnailUrl: [video.thumbnailUrl],
    uploadDate: video.uploadDate,
    ...(video.contentUrl ? { contentUrl: video.contentUrl } : {}),
    ...(video.embedUrl ? { embedUrl: video.embedUrl } : {}),
    // The page the video is watched on — this is what Google links a video
    // result to. Not `mainEntityOfPage`: the article already claims that, and
    // two entities claiming to be the page's main entity is a contradiction.
    url: pageUrl,
    publisher: {
      "@type": "Organization",
      name: ORG_LEGAL_NAME,
      logo: { "@type": "ImageObject", url: url("/icon") },
    },
  };
}

/**
 * SoftwareApplication for the EnergieBee app — surfaces the product in search
 * with an app-style rich result. No aggregateRating/price asserted (would need
 * real, verifiable data).
 */
export function softwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    operatingSystem: "iOS, Android, Web",
    applicationCategory: "LifestyleApplication",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    image: url("/api/og"),
    // Free app — a truthful zero-price Offer. No aggregateRating: we have no
    // verifiable reviews, and fabricated ratings risk a Google penalty.
    offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
    publisher: { "@type": "Organization", name: ORG_LEGAL_NAME },
  };
}

/**
 * FAQPage for a marketing page's FAQ section. Google requires the same Q&A
 * to be VISIBLE on the page — always render this alongside a visible <Faq>,
 * never on its own, or it risks a structured-data penalty.
 */
export function faqPageSchema(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.question,
      acceptedAnswer: { "@type": "Answer", text: it.answer },
    })),
  };
}

/** Person schema for an author profile page (E-E-A-T). */
export function personSchema(author: {
  name: string;
  slug: string;
  role: string | null;
  bio: string | null;
  avatarUrl: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.name,
    url: absolute(`/author/${author.slug}`),
    ...(author.role ? { jobTitle: author.role } : {}),
    ...(author.bio ? { description: author.bio } : {}),
    ...(author.avatarUrl ? { image: absolute(author.avatarUrl) } : {}),
    worksFor: { "@type": "Organization", name: ORG_LEGAL_NAME, url: SITE_URL },
  };
}

/** CollectionPage for a blog listing / tag page. */
export function collectionPageSchema(opts: {
  name: string;
  description: string;
  path: string;
  items: { title: string; path: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: opts.name,
    description: opts.description,
    url: absolute(opts.path),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: opts.items.map((it, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: it.title,
        url: absolute(it.path),
      })),
    },
  };
}
