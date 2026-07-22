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
 * Generates /robots.txt at build time. Allows all crawlers — including the
 * AI crawlers above — everywhere except internal Next.js paths, the admin
 * panel, and the member account section, and points at the sitemap. The admin
 * and account routes are also marked noindex via metadata and an X-Robots-Tag
 * header (see their layouts and next.config.ts).
 */
export default function robots(): MetadataRoute.Robots {
  // Non-production hosts (sandbox, previews) must stay out of search. Crucially
  // we ALLOW crawling here rather than `Disallow: /`: de-indexing relies on the
  // site-wide `X-Robots-Tag: noindex` header (next.config.ts), and Google can
  // only act on that header if it's allowed to fetch the page. A blanket
  // Disallow would block the crawl and leave already-indexed URLs stuck in the
  // index as URL-only results. Omit the sitemap so we don't advertise URLs.
  if (!IS_PRODUCTION) {
    return { rules: [{ userAgent: "*", allow: "/" }] };
  }

  const disallow = ["/api/", "/admin", "/account"];
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow,
      },
      // Explicit (redundant-but-intentional) allow for AI crawlers, so the
      // policy is documented and obvious rather than relying on the wildcard.
      {
        userAgent: AI_CRAWLERS,
        allow: "/",
        disallow,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    // The Host directive expects a bare domain, not a full URL.
    host: SITE_URL.replace(/^https?:\/\//, ""),
  };
}
