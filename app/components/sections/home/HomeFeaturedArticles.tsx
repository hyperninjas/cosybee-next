import { getHomeFeatured } from "@/app/lib/articles";
import { HomeFeaturedArticlesView } from "./HomeFeaturedArticlesView";

/**
 * Server wrapper for the home-page featured articles band. Fetches the posts
 * flagged `homeFeatured` (across both blogs) and hands them to the client view,
 * which picks a grid (≤4) or a carousel (>4). Renders nothing when none are
 * flagged, so the home page simply omits the band.
 */
export default async function HomeFeaturedArticles() {
  const articles = await getHomeFeatured();
  if (articles.length === 0) return null;

  return <HomeFeaturedArticlesView articles={articles} viewAllHref="/hive" />;
}
