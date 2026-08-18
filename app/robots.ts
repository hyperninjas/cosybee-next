import type { MetadataRoute } from "next";
import { IS_PRODUCTION, SITE_URL } from "./lib/site";

/**
 * Known AI / LLM crawlers. We explicitly ALLOW them so EnergieBee content
 * stays eligible to be cited in AI answer engines (ChatGPT, Perplexity,
 * Google AI Overviews, etc.) — a deliberate visibility choice for a
 * marketing/content site. To restrict any of them later, give it its own
 * rule with `disallow: "/"`.
 */
const AI_CRAWLERS = [
  "GPTBot", // OpenAI (training)
  "OAI-SearchBot", // OpenAI (ChatGPT search)
  "ChatGPT-User", // OpenAI (user-initiated browsing)
  "ClaudeBot", // Anthropic
  "Claude-User", // Anthropic (user-initiated)
  "anthropic-ai", // Anthropic (legacy)
  "PerplexityBot", // Perplexity
  "Perplexity-User", // Perplexity (user-initiated)
  "Google-Extended", // Google Gemini / Vertex training
  "Applebot-Extended", // Apple Intelligence
  "CCBot", // Common Crawl (feeds many LLMs)
  "Bytespider", // ByteDance
  "Amazonbot", // Amazon
  "Meta-ExternalAgent", // Meta AI
];

/**
 * Search engines that must be able to CRAWL non-production hosts so they can
 * read the `X-Robots-Tag: noindex` header and drop those URLs. Listing them by
 * name lets the sandbox block everything else without blocking de-indexing.
 * Sub-agents (Googlebot-Image, Googlebot-News, ...) are deliberately absent —
 * they fall through to the wildcard block, which is what we want for staging.
 */
const SEARCH_CRAWLERS = [
  "Googlebot", // Google
  "Bingbot", // Bing — also powers DuckDuckGo and Yahoo
  "Slurp", // Yahoo
  "DuckDuckBot", // DuckDuckGo
  "YandexBot", // Yandex
  "Baiduspider", // Baidu
  "Applebot", // Apple / Siri / Spotlight
];

/**
 * Generates /robots.txt at build time, with a different policy per environment.
 *
 * On PRODUCTION: allows all crawlers — including the AI crawlers above —
 * everywhere except internal Next.js paths, the admin panel, and the member
 * account section, and points at the sitemaps. The admin and account routes are
 * also marked noindex via metadata and an X-Robots-Tag header (see their
 * layouts and next.config.ts).
 *
 * On every OTHER host (sandbox, previews): search engines may crawl so they can
 * see the site-wide noindex header, and everything else is blocked outright.
 * See the comment in the branch below — the asymmetry is deliberate.
 */
export default function robots(): MetadataRoute.Robots {
  // Non-production hosts (sandbox, previews) must stay out of search, and the
  // two rules below do different jobs:
  //
  //  1. The named search engines are ALLOWED to crawl. De-indexing relies on
  //     the site-wide `X-Robots-Tag: noindex` header (next.config.ts), and a
  //     crawler can only obey a header it is permitted to fetch. Blocking them
  //     would strand any already-indexed URL in the index as a URL-only result
  //     with no way to remove it — robots.txt governs crawling, not indexing.
  //     Each engine gets its own group because Google and Bing apply only the
  //     single most specific matching group, never the wildcard as well.
  //
  //  2. Everything else is BLOCKED. AI scrapers and minor crawlers largely
  //     ignore X-Robots-Tag, so for them robots.txt is the only lever, and
  //     unreleased staging content has no business being scraped at all.
  //
  // The sitemap is omitted either way so we never advertise the URL list.
  if (!IS_PRODUCTION) {
    return {
      rules: [
        { userAgent: SEARCH_CRAWLERS, allow: "/" },
        { userAgent: "*", disallow: "/" },
      ],
    };
  }

  const disallow = ["/api/", "/admin", "/account"];
  // `/api/` is closed, but the social/rich-result card images live under it
  // (`/api/og` and `/api/og/article/*` — see lib/seo.ts, lib/structured-data.ts
  // and the article pages). Crawlers that honour robots.txt — Facebook's
  // scraper among them — would otherwise refuse to fetch the image and fall
  // back to a preview with no card. The longer, more specific rule wins over
  // the `/api/` disallow for Google and Bing regardless of line order.
  const allow = ["/", "/api/og"];
  return {
    rules: [
      {
        userAgent: "*",
        allow,
        disallow,
      },
      // Explicit (redundant-but-intentional) allow for AI crawlers, so the
      // policy is documented and obvious rather than relying on the wildcard.
      {
        userAgent: AI_CRAWLERS,
        allow,
        disallow,
      },
    ],
    // Both files are advertised: the video sitemap is a separate document
    // because Google reads the `video:` namespace only from a sitemap that
    // declares it, and Next's sitemap route has no vocabulary for it.
    sitemap: [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/video-sitemap.xml`],
    // The Host directive expects a bare domain, not a full URL.
    host: SITE_URL.replace(/^https?:\/\//, ""),
  };
}
