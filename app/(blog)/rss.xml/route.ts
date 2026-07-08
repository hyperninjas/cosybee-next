import { getAllArticles } from "@/app/lib/articles";
import type { Article } from "@/app/lib/article-types";
import {
  SITE_NAME,
  SITE_URL,
  SITE_DESCRIPTION,
  ORG_LEGAL_NAME,
  ORG_CONTACT_EMAIL,
  url,
} from "@/app/lib/site";

// Re-generate at most hourly; survives the backend being unreachable.
export const revalidate = 3600;

/** Escape a string for inclusion in XML text/attribute content. */
function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Best-effort RFC-822 date (required by RSS) from an ISO string. */
function rfc822(iso: string | null): string {
  const d = iso ? new Date(iso) : new Date();
  return (isNaN(d.getTime()) ? new Date() : d).toUTCString();
}

function itemXml(a: Article): string {
  const link = url(`/${a.blog}/${a.slug}`);
  const desc = a.seoDescription ?? a.description ?? "";
  const categories = a.tags
    .map((t) => `<category>${escapeXml(t.name)}</category>`)
    .join("");
  return `    <item>
      <title>${escapeXml(a.seoTitle ?? a.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${rfc822(a.publishedAt ?? a.authorDate)}</pubDate>
      ${a.author?.name ? `<dc:creator>${escapeXml(a.author.name)}</dc:creator>` : ""}
      ${a.category?.name ? `<category>${escapeXml(a.category.name)}</category>` : ""}
      ${categories}
      <description>${escapeXml(desc)}</description>
    </item>`;
}

export async function GET() {
  const [hive, learn] = await Promise.all([
    getAllArticles("hive").catch(() => [] as Article[]),
    getAllArticles("learn").catch(() => [] as Article[]),
  ]);

  // Newest first across both blogs.
  const articles = [...hive, ...learn].sort((a, b) => {
    const ta = new Date(a.publishedAt ?? a.authorDate ?? 0).getTime();
    const tb = new Date(b.publishedAt ?? b.authorDate ?? 0).getTime();
    return tb - ta;
  });

  const lastBuild = rfc822(articles[0]?.publishedAt ?? null);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(SITE_NAME)} — Blog</title>
    <link>${escapeXml(SITE_URL)}</link>
    <atom:link href="${escapeXml(url("/rss.xml"))}" rel="self" type="application/rss+xml" />
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en-GB</language>
    <copyright>© ${ORG_LEGAL_NAME}</copyright>
    <managingEditor>${escapeXml(ORG_CONTACT_EMAIL)} (${escapeXml(ORG_LEGAL_NAME)})</managingEditor>
    <lastBuildDate>${lastBuild}</lastBuildDate>
${articles.map(itemXml).join("\n")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
