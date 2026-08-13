import type { CategorySummary } from "./article-types";

/**
 * Shared indexing rules for the two blog hubs (/hive and /learn).
 *
 * The hubs are deliberate forks of each other, but what they tell Google must
 * not be — a rule that drifts between them is the kind of bug that shows up
 * weeks later in Search Console. Both call `hubIndexing`.
 */

/**
 * Resolve a `?category=` value to a known category slug, or "" for none.
 *
 * Accepts the slug (what the chips mirror today) and the display NAME (what
 * links shared before the category pages existed carry), so an old bookmark
 * still opens the view it used to. Anything unrecognised resolves to "" — an
 * unknown category is the plain hub, not an error.
 */
export function resolveCategorySlug(
  categories: readonly CategorySummary[],
  raw: string | undefined,
): string {
  if (!raw) return "";
  return (
    categories.find((c) => c.slug === raw)?.slug ??
    categories.find((c) => c.name === raw)?.slug ??
    ""
  );
}

/**
 * What canonical a hub URL should declare, and whether it may be indexed.
 *
 * Three cases, in the order they're decided:
 *
 *  1. **Search or tag active** → `noindex`, canonical to *itself*. These views
 *     are shareable but thin, and they have no canonical equivalent elsewhere
 *     on the site. Self-canonical rather than pointing at the hub on purpose:
 *     `noindex` plus a canonical to a *different* URL is a contradiction Google
 *     documents as a thing to avoid — it can carry the `noindex` across to the
 *     target, which here would be the hub itself.
 *
 *  2. **Category only** → indexable, canonical to `/[blog]/category/[slug]`.
 *     The filtered view and the category page list the same articles, so this
 *     is textbook canonicalisation: one declaration folds the query form into
 *     the pretty URL and consolidates its signals, instead of throwing them
 *     away with a `noindex`. No contradiction, because nothing here says
 *     "don't index" — it says "this content lives at that URL".
 *
 *  3. **Plain browse** → self-canonical, indexable, with `?page=N` preserved so
 *     deep pages index independently.
 */
export function hubIndexing({
  base,
  query,
  categorySlug,
  tag,
  page,
}: {
  /** "/hive" | "/learn". */
  base: string;
  query: string;
  /** Already resolved by `resolveCategorySlug` — a real slug, or "". */
  categorySlug: string;
  tag: string;
  page: number;
}): { path: string; index: boolean } {
  if (query || tag) {
    // Rebuilt the same way BlogBrowse mirrors it, so the canonical this page
    // declares is character-for-character the URL the user is actually on.
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (categorySlug) params.set("category", categorySlug);
    if (tag) params.set("tag", tag);
    return { path: `${base}?${params.toString()}`, index: false };
  }
  if (categorySlug) {
    return { path: `${base}/category/${categorySlug}`, index: true };
  }
  return { path: page > 1 ? `${base}?page=${page}` : base, index: true };
}
