import type { MetadataRoute } from "next";
import { ROUTES, SITE_URL } from "./lib/site";
import { getPublishedSlugs } from "./lib/articles";

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

  const [hiveSlugs, learnSlugs] = await Promise.all([
    getPublishedSlugs("hive"),
    getPublishedSlugs("learn"),
  ]);

  const articleRoutes = [
    ...hiveSlugs.map((slug) => `/hive/${slug}`),
    ...learnSlugs.map((slug) => `/learn/${slug}`),
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...articleRoutes];
}
