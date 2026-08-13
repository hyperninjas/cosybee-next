import { permanentRedirect } from "next/navigation";
import { getCategorySummaries } from "@/app/lib/articles";

/**
 * WordPress's flat `/category/[slug]` archive, resolved to wherever that
 * category lives now.
 *
 * A static redirect in next.config.ts can't do this: the old URLs carry no
 * blog, so `/category/solar` is only knowable as `/learn/category/solar` by
 * looking at the data. Hence a route that resolves, not a rewrite rule.
 *
 *   known slug  → /hive/category/[slug] or /learn/category/[slug]
 *   unknown     → /hive
 *
 * Unknown lands on the hub rather than a 404 on purpose. These URLs are years
 * of accumulated inbound links and crawler memory; the blog index is a real,
 * indexable page that answers roughly what the visitor wanted, where a 404
 * answers nothing and drops whatever the link was worth.
 *
 * Always 308, never 307 — the WordPress URL structure is gone for good, so the
 * signals pointing at it should transfer rather than be held in limbo.
 *
 * This page renders nothing: every path through it redirects.
 */
export default async function LegacyCategoryPage({
  params,
}: PageProps<"/category/[slug]">) {
  const { slug } = await params;
  const [hive, learn] = await Promise.all([
    getCategorySummaries("hive"),
    getCategorySummaries("learn"),
  ]);

  // Hive wins a slug present in both. The two blogs keep separate category
  // lists, so a collision is possible; picking a side keeps the redirect
  // deterministic instead of dependent on read order.
  if (hive.some((c) => c.slug === slug)) {
    permanentRedirect(`/hive/category/${slug}`);
  }
  if (learn.some((c) => c.slug === slug)) {
    permanentRedirect(`/learn/category/${slug}`);
  }
  permanentRedirect("/hive");
}
