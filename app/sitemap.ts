import type { MetadataRoute } from "next";
import { ROUTES, SITE_URL } from "./lib/site";
import {
  getSitemapArticles,
  getTagSummaries,
  getCategorySummaries,
  getAuthorSummaries,
  getPublishedCount,
  isIndexableAuthor,
  isIndexableCategory,
  isIndexableTag,
  newestOf,
} from "./lib/articles";
import { browsePageCount } from "./lib/article-types";

/**
 * Generates /sitemap.xml.
 *
 * Static pages come from the canonical `ROUTES` list — add a new page →
 * add it to `ROUTES` in lib/site.ts. Everything else is derived from published
 * posts, so publishing an article in the admin panel surfaces the article, its
 * tags and its author here with no code change.
 *
 * Two rules this file holds to:
 *
 *  1. Never list a URL the site tells Google to skip. Every entry below is
 *     gated by the same predicate the corresponding page uses for its `robots`
 *     directive, so the sitemap and the page always say the same thing.
 *  2. Never send a `lastModified` we can't stand behind. Anything without a
 *     real date omits the field instead of substituting the current time.
 *
 * Freshness: the data reads are tagged (CONTENT_TAG), so admin mutations call
 * `revalidateContent()` and this file rebuilds on the next request. If those
 * reads throw, this route throws too — Next then keeps serving the last good
 * sitemap rather than caching a short one. See lib/articles.ts.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [
    hiveArticles,
    learnArticles,
    hiveTags,
    learnTags,
    authors,
    hiveCount,
    learnCount,
    hiveCategories,
    learnCategories,
  ] = await Promise.all([
    getSitemapArticles("hive"),
    getSitemapArticles("learn"),
    getTagSummaries("hive"),
    getTagSummaries("learn"),
    getAuthorSummaries(),
    getPublishedCount("hive"),
    getPublishedCount("learn"),
    getCategorySummaries("hive"),
    getCategorySummaries("learn"),
  ]);

  // The two blog indexes are listings of their articles, so the newest article
  // is genuinely when the page last changed. Every other static page either
  // declares its own date in ROUTES or gets no <lastmod> at all.
  const blogUpdated: Record<string, Date | undefined> = {
    "/hive": newestOf(hiveArticles),
    "/learn": newestOf(learnArticles),
  };

  const staticRoutes = ROUTES.map((route) => {
    const lastModified =
      blogUpdated[route.path] ??
      (route.lastModified ? new Date(route.lastModified) : undefined);
    return {
      url: `${SITE_URL}${route.path}`,
      ...(lastModified ? { lastModified } : {}),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    };
  });

  // Page 2+ of each hub. Those pages are self-canonical and indexable (see the
  // hub's generateMetadata), but the only other path to them is a `rel=next`
  // chain Google has to walk one hop at a time — so a deep page can sit
  // undiscovered for weeks. Page 1 is already covered by ROUTES above; the page
  // count comes from `browsePageCount`, the same function the hub uses to 404
  // anything past the end, so this can't advertise a page that doesn't exist.
  //
  // `lastModified` is the hub's own date: publishing an article shifts every
  // article down the list, so page 5's contents genuinely change when the
  // newest article does.
  const paginationRoutes = (
    [
      ["/hive", hiveCount],
      ["/learn", learnCount],
    ] as const
  ).flatMap(([path, count]) => {
    const lastModified = blogUpdated[path];
    return Array.from(
      { length: browsePageCount(count) - 1 },
      (_, i) => i + 2,
    ).map((page) => ({
      url: `${SITE_URL}${path}?page=${page}`,
      ...(lastModified ? { lastModified } : {}),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));
  });

  const articleRoutes = [...hiveArticles, ...learnArticles].map((a) => ({
    url: `${SITE_URL}${a.path}`,
    lastModified: a.lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Category landing pages. Ranked above tags on purpose: categories are the
  // blog's own navigation — a curated handful, each a page a search visitor can
  // legitimately land on — where tags are a long tail. Gated by the same
  // predicate the category page applies to its own `robots` directive.
  const categoryRoutes = [
    ...hiveCategories.map((c) => ({ ...c, path: `/hive/category/${c.slug}` })),
    ...learnCategories.map((c) => ({ ...c, path: `/learn/category/${c.slug}` })),
  ]
    .filter((c) => isIndexableCategory(c.count))
    .map((c) => ({
      url: `${SITE_URL}${c.path}`,
      lastModified: c.lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

  // Only tags with enough articles to stand as their own search result — see
  // isIndexableTag. Thinner tags are marked noindex by the tag page itself,
  // so listing them here would only advertise URLs we've asked Google to skip.
  const tagRoutes = [
    ...hiveTags.map((t) => ({ ...t, path: `/hive/tag/${t.slug}` })),
    ...learnTags.map((t) => ({ ...t, path: `/learn/tag/${t.slug}` })),
  ]
    .filter((t) => isIndexableTag(t.count))
    .map((t) => ({
      url: `${SITE_URL}${t.path}`,
      lastModified: t.lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));

  // Authors qualify on a bio or a second article — see isIndexableAuthor. The
  // author page applies the same test to its own `robots` directive.
  const authorRoutes = authors
    .filter((a) => isIndexableAuthor(a.count, a.bio))
    .map((a) => ({
      url: `${SITE_URL}/author/${a.slug}`,
      lastModified: a.lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.4,
    }));

  return [
    ...staticRoutes,
    ...paginationRoutes,
    ...categoryRoutes,
    ...articleRoutes,
    ...tagRoutes,
    ...authorRoutes,
  ];
}
