import type { MetadataRoute } from "next";
import { ROUTES, SITE_URL } from "./lib/site";
import { getPublishedSlugs } from "./lib/hive-articles";
import { getPublishedLearnSlugs } from "./lib/learn-articles";

/**
 * Generates /sitemap.xml at build time.
 *
 * Static pages come from the canonical `ROUTES` list — add a new page →
 * add it to `ROUTES` in lib/site.ts. Blog article pages are derived
 * automatically from the article data, so adding an article (with a
 * body) to hive-articles.ts / learn-articles.ts requires no change here.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticRoutes = ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const articleRoutes = [
    ...getPublishedSlugs().map((slug) => `/hive/${slug}`),
    ...getPublishedLearnSlugs().map((slug) => `/learn/${slug}`),
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...articleRoutes];
}
