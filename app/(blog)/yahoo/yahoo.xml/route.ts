import { FEEDS } from "@/app/lib/rss-feed";
import {
  renderSyndicationFeed,
  SYNDICATION_HEADERS,
} from "@/app/lib/syndication-feed";

/** RSS article feed for Yahoo Partner Portal ingestion. */
export async function GET() {
  const { xml, itemCount, droppedCount } = await renderSyndicationFeed(
    FEEDS.yahoo,
  );

  return new Response(xml, {
    headers: {
      ...SYNDICATION_HEADERS,
      "X-Feed-Item-Count": String(itemCount),
      "X-Feed-Dropped-Count": String(droppedCount),
    },
  });
}
