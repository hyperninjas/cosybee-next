import type { MetadataRoute } from "next";
import { ROUTES, SITE_URL } from "./lib/site";
import {
  getSitemapArticles,
  getTagSummaries,
  getAuthorSummaries,
  isIndexableAuthor,
  isIndexableTag,
  newestOf,
} from "./lib/articles";

/**
 * Generates /sitemap.xml.
 *
 * Static pages come from the canonical `ROUTES` list — add a new page →
 * add it to `ROUTES` in lib/site.ts. Everything else is derived from published
 * posts, so publishing an article in the admin panel surfaces the article, its
 * tags and its author here with no code change.
 *
 * Two rules this file holds to:
 *
 *  1. Never list a URL the site tells Google to skip. Every entry below is
 *     gated by the same predicate the corresponding page uses for its `robots`
 *     directive, so the sitemap and the page always say the same thing.
 *  2. Never send a `lastModified` we can't stand behind. Anything without a
 *     real date omits the field instead of substituting the current time.
 *
 * Freshness: the data reads are tagged (CONTENT_TAG), so admin mutations call
 * `revalidateContent()` and this file rebuilds on the next request. If those
 * reads throw, this route throws too — Next then keeps serving the last good
 * sitemap rather than caching a short one. See lib/articles.ts.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [hiveArticles, learnArticles, hiveTags, learnTags, authors] =
    await Promise.all([
      getSitemapArticles("hive"),
      getSitemapArticles("learn"),
      getTagSummaries("hive"),
      getTagSummaries("learn"),
      getAuthorSummaries(),
    ]);

  // The two blog indexes are listings of their articles, so the newest article
  // is genuinely when the page last changed. Every other static page either
  // declares its own date in ROUTES or gets no <lastmod> at all.
  const blogUpdated: Record<string, Date | undefined> = {
    "/hive": newestOf(hiveArticles),
    "/learn": newestOf(learnArticles),
  };

  const staticRoutes = ROUTES.map((route) => {
    const lastModified =
      blogUpdated[route.path] ??
      (route.lastModified ? new Date(route.lastModified) : undefined);
    return {
      url: `${SITE_URL}${route.path}`,
      ...(lastModified ? { lastModified } : {}),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    };
  });

  const articleRoutes = [...hiveArticles, ...learnArticles].map((a) => ({
    url: `${SITE_URL}${a.path}`,
    lastModified: a.lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Only tags with enough articles to stand as their own search result — see
  // isIndexableTag. Thinner tags are marked noindex by the tag page itself,
  // so listing them here would only advertise URLs we've asked Google to skip.
  const tagRoutes = [
    ...hiveTags.map((t) => ({ ...t, path: `/hive/tag/${t.slug}` })),
    ...learnTags.map((t) => ({ ...t, path: `/learn/tag/${t.slug}` })),
  ]
    .filter((t) => isIndexableTag(t.count))
    .map((t) => ({
      url: `${SITE_URL}${t.path}`,
      lastModified: t.lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));

  // Authors qualify on a bio or a second article — see isIndexableAuthor. The
  // author page applies the same test to its own `robots` directive.
  const authorRoutes = authors
    .filter((a) => isIndexableAuthor(a.count, a.bio))
    .map((a) => ({
      url: `${SITE_URL}/author/${a.slug}`,
      lastModified: a.lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.4,
    }));

  return [...staticRoutes, ...articleRoutes, ...tagRoutes, ...authorRoutes];
}
