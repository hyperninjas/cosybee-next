import { getIndexableArticlesWithContent } from "@/app/lib/articles";
import { buildVideoSitemap, MAX_SITEMAP_URLS } from "@/app/lib/video-sitemap";

/**
 * Generates /video-sitemap.xml — a Google video sitemap covering every video
 * embedded in a published article.
 *
 * Why a file separate from `/sitemap.xml`: Next's `MetadataRoute.Sitemap` has
 * no vocabulary for the `video:` namespace, and Google reads video extensions
 * only from a sitemap that declares it. robots.txt advertises both.
 *
 * The rules this route holds to, in order of how quietly they break:
 *
 *  1. Only articles that actually contain a video appear — see
 *     `buildVideoSitemap`.
 *  2. Only videos we can describe completely appear. Google rejects an entry
 *     missing a thumbnail, title, description or playable location, so
 *     `resolveArticleVideos` drops those rather than emit a partial one.
 *  3. Never list a URL the site tells Google to skip. `noindex` articles and
 *     ones pointing at a foreign canonical are filtered by
 *     `getIndexableArticlesWithContent` — the same predicate `/sitemap.xml`
 *     uses, so the two files can't contradict each other.
 *  4. Never publish a truncated catalogue. The reads underneath throw on a
 *     backend error instead of returning a short list, so a blip serves the
 *     last good file rather than caching "these videos are gone".
 *
 * Freshness: those reads are tagged (CONTENT_TAG), so an admin save — adding
 * or removing a video included — calls `revalidateContent()` and the next
 * request rebuilds this file. There is no separate step to remember.
 */
export async function GET() {
  const [hive, learn] = await Promise.all([
    getIndexableArticlesWithContent("hive"),
    getIndexableArticlesWithContent("learn"),
  ]);

  const { xml, urlCount, videoCount } = buildVideoSitemap([...hive, ...learn]);

  if (urlCount > MAX_SITEMAP_URLS) {
    // Loud rather than silently truncated: a quietly short sitemap reads as
    // "those pages have no videos", which is the opposite of the truth.
    console.error(
      `[video-sitemap] ${urlCount} URLs exceeds Google's ${MAX_SITEMAP_URLS} cap — split into a sitemap index.`,
    );
  }

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // Mirrors the Data Cache TTL behind it (api.ts). Admin saves drop that
      // cache outright, so the next request rebuilds regardless of what a CDN
      // was told here.
      "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
      // Cheap observability: confirms at a glance whether a deploy is finding
      // the videos it should, without parsing the body.
      "X-Video-Count": String(videoCount),
    },
  });
}
