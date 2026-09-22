import { getSitemapArticles } from "@/app/lib/articles";
import { escapeXml } from "@/app/lib/xml";
import { SITE_URL } from "@/app/lib/site";

const MAX_SITEMAP_URLS = 50_000;

/**
 * Standard article sitemap for Bing and other search engines.
 * Unlike the Google News sitemap, this includes the complete published article
 * catalogue from both blog sections and has no provider-specific namespace.
 */
export async function GET() {
  const [hive, learn] = await Promise.all([
    getSitemapArticles("hive"),
    getSitemapArticles("learn"),
  ]);
  const articles = [...hive, ...learn].sort(
    (a, b) => b.lastModified.getTime() - a.lastModified.getTime(),
  );

  if (articles.length > MAX_SITEMAP_URLS) {
    throw new Error(
      `Article sitemap contains ${articles.length} URLs; split it into a sitemap index before exceeding ${MAX_SITEMAP_URLS}.`,
    );
  }

  const entries = articles.map(
    (article) => `  <url>
    <loc>${escapeXml(`${SITE_URL}${article.path}`)}</loc>
    <lastmod>${article.lastModified.toISOString()}</lastmod>
  </url>`,
  );
  const body = entries.length ? `\n${entries.join("\n")}\n` : "\n";
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control":
        "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
