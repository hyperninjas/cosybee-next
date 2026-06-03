import type { MetadataRoute } from "next";
import { SITE_URL } from "./lib/site";

/**
 * Generates /robots.txt at build time. Allows all crawlers everywhere
 * except internal Next.js paths and the admin panel, and points at the
 * sitemap. The admin routes are also marked noindex via metadata and an
 * X-Robots-Tag header (see app/admin/layout.tsx and next.config.ts).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    // The Host directive expects a bare domain, not a full URL.
    host: SITE_URL.replace(/^https?:\/\//, ""),
  };
}
