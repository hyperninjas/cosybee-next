import { getFeedArticles } from "@/app/lib/articles";
import { buildRssFeed, FEED_HEADERS, FEEDS } from "@/app/lib/rss-feed";

// Same contract as /rss.xml: rebuilt on every request, no caching anywhere, so
// a poll always sees what is published right now. See that route for why.
export const dynamic = "force-dynamic";

/**
 * `/news/applenews.xml` — the feed given to Apple News.
 *
 * Identical content to `/rss.xml` for now. When the Apple News channel is set
 * up properly it will want the full article body in `content:encoded` (Apple
 * renders the feed, so a description-only item publishes as a stub) — that is a
 * per-feed option on `FEEDS.applenews` plus a content-carrying read
 * (`getIndexableArticlesWithContent`), not a second copy of the builder.
 */
export async function GET() {
  const articles = await getFeedArticles();

  return new Response(buildRssFeed(articles, FEEDS.applenews), {
    headers: FEED_HEADERS,
  });
}
