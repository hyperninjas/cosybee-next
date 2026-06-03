import type { MetadataRoute } from "next";
import { ROUTES, SITE_URL } from "./lib/site";
import { getSitemapArticles, getTagSlugs } from "./lib/articles";

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

  const [hiveArticles, learnArticles, hiveTags, learnTags] = await Promise.all([
    getSitemapArticles("hive"),
    getSitemapArticles("learn"),
    getTagSlugs("hive"),
    getTagSlugs("learn"),
  ]);

  const articleRoutes = [...hiveArticles, ...learnArticles].map((a) => ({
    url: `${SITE_URL}${a.path}`,
    lastModified: a.lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const tagRoutes = [
    ...hiveTags.map((t) => `/hive/tag/${t}`),
    ...learnTags.map((t) => `/learn/tag/${t}`),
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [...staticRoutes, ...articleRoutes, ...tagRoutes];
}
