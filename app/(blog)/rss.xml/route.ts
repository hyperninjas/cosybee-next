import { getFeedArticles } from "@/app/lib/articles";
import { buildRssFeed, FEED_HEADERS, FEEDS } from "@/app/lib/rss-feed";

// Always reflect the latest published posts: render on every request and
// refetch from the backend each time (no caching). `force-dynamic` also sets
// this route's fetches to no-store, overriding the shared API client's default
// 60s revalidate — but only for this route; the rest of the site keeps caching.
// Trade-off: if the backend is unreachable the feed serves an empty list rather
// than stale content, which is the intended "update on fetch" behaviour.
export const dynamic = "force-dynamic";

/**
 * The public blog feed — the one linked for auto-discovery from every page
 * (RSS_ALTERNATE_TYPES in lib/site.ts) and the URL readers subscribe to.
 *
 * The syndication partners get their own paths under `/news/` so a change made
 * for one of them can't disturb this feed; all three share the builder and the
 * article list, so they can't drift apart by accident either.
 */
export async function GET() {
  const articles = await getFeedArticles();

  return new Response(buildRssFeed(articles, FEEDS.blog), {
    headers: FEED_HEADERS,
  });
}
