import type { MetadataRoute } from "next";
import { SITE_URL } from "./lib/site";

/**
 * Generates /robots.txt at build time. Allows all crawlers everywhere
 * except internal Next.js paths, and points at the sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
