import { FEEDS } from "@/app/lib/rss-feed";
import {
  renderSyndicationFeed,
  SYNDICATION_HEADERS,
} from "@/app/lib/syndication-feed";

/**
 * RSS feed for Microsoft Start via MSN Partner Hub.
 *
 * The shared syndication pipeline supplies the full article body in
 * `content:encoded`, a lead image, `media:thumbnail`, and the required RSS
 * permalink, GUID, title, and publication date fields.
 */
export async function GET() {
  const { xml, itemCount, droppedCount } = await renderSyndicationFeed(
    FEEDS.msn,
  );

  return new Response(xml, {
    headers: {
      ...SYNDICATION_HEADERS,
      "X-Feed-Item-Count": String(itemCount),
      "X-Feed-Dropped-Count": String(droppedCount),
    },
  });
}