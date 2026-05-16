import type { MetadataRoute } from "next";
import { ROUTES, SITE_URL } from "./lib/site";

/**
 * Generates /sitemap.xml at build time from the canonical ROUTES list.
 * Add a new page → add it to `ROUTES` in lib/site.ts and the sitemap
 * picks it up automatically.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
