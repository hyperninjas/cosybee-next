import type { MetadataRoute } from "next";
import { ROUTES, SITE_URL } from "./lib/site";
import {
  getSitemapArticles,
  getTagCounts,
  getAuthorSlugs,
  MIN_TAG_ARTICLES,
} from "./lib/articles";

/**
 * Generates /sitemap.xml.
 *
 * Static pages come from the canonical `ROUTES` list — add a new page →
 * add it to `ROUTES` in lib/site.ts. Blog article pages are derived
 * automatically from published posts in the database, so publishing an
 * article in the admin panel surfaces it here with no code change.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const staticRoutes = ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const [hiveArticles, learnArticles, hiveTags, learnTags, authorSlugs] =
    await Promise.all([
      getSitemapArticles("hive"),
      getSitemapArticles("learn"),
      getTagCounts("hive"),
      getTagCounts("learn"),
      getAuthorSlugs(),
    ]);

  const articleRoutes = [...hiveArticles, ...learnArticles].map((a) => ({
    url: `${SITE_URL}${a.path}`,
    lastModified: a.lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Only tags with enough articles to stand as their own search result — see
  // MIN_TAG_ARTICLES. Thinner tags are marked noindex by the tag page itself,
  // so listing them here would only advertise URLs we've asked Google to skip.
  const tagRoutes = [
    ...hiveTags.map((t) => ({ ...t, path: `/hive/tag/${t.slug}` })),
    ...learnTags.map((t) => ({ ...t, path: `/learn/tag/${t.slug}` })),
  ]
    .filter((t) => t.count >= MIN_TAG_ARTICLES)
    .map(({ path }) => ({
      url: `${SITE_URL}${path}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));

  const authorRoutes = authorSlugs.map((slug) => ({
    url: `${SITE_URL}/author/${slug}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.4,
  }));

  return [...staticRoutes, ...articleRoutes, ...tagRoutes, ...authorRoutes];
}
