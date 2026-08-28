import { getFeedArticles } from "@/app/lib/articles";
import { buildRssFeed, FEED_HEADERS, FEEDS } from "@/app/lib/rss-feed";

// Same contract as /rss.xml: rebuilt on every request, no caching anywhere, so
// a poll always sees what is published right now. See that route for why.
export const dynamic = "force-dynamic";

/**
 * `/newsnow/newsnow.xml` — the feed given to NewsNow.
 *
 * Identical content to `/rss.xml` for now; it exists as its own URL so the
 * aggregator's polling is visible separately in logs, and so anything NewsNow
 * asks for later (a narrower article set, extra channel elements) can be added
 * without touching the feed readers subscribe to. Feed-specific parts belong in
 * `FEEDS.newsnow` (lib/rss-feed.ts), not in a fork of the builder.
 */
export async function GET() {
  const articles = await getFeedArticles();

  return new Response(buildRssFeed(articles, FEEDS.newsnow), {
    headers: FEED_HEADERS,
  });
}
