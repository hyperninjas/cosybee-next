import { AppLink as Link } from "@/app/components/ui/AppLink";
import { buttonVariants } from "@heroui/styles";
import type { CategorySummary } from "@/app/lib/article-types";

/**
 * The blog's category row, as real links.
 *
 * Anchors, not buttons, on purpose: this row is the only path to the category
 * landing pages, and a `<button onPress>` leaves nothing in the HTML for a
 * crawler to follow — the category pages were invisible to Google for exactly
 * that reason. Real `href`s also restore middle-click, "open in new tab",
 * back/forward and sharing, which the old `replaceState` filter broke.
 *
 * Rendered by both the hub's filter bar and each category page, so switching
 * categories works the same in both places.
 *
 * Styled with HeroUI's `buttonVariants()` over a Next `<Link>` — the pattern
 * HeroUI documents for framework routers, keeping prefetch and client nav
 * (so a chip still feels instant) while the DOM keeps a plain `<a href>`.
 */
export default function CategoryChips({
  categories,
  basePath,
  activeSlug,
  className = "",
}: {
  categories: readonly CategorySummary[];
  /** "/hive" | "/learn". */
  basePath: string;
  /** Slug of the category being viewed; null on the unfiltered hub, where the
   *  row is a plain list of destinations and needs no "All" escape hatch. */
  activeSlug?: string | null;
  className?: string;
}) {
  // Both class strings are built once, outside the loop: the React Compiler
  // gives standalone functions their own memo cache, and calling one inside a
  // render-time `.map` trips a useMemoCache size mismatch. Same reason the
  // article matcher in BlogLatestArticles is inlined.
  const chip = "shrink-0 rounded-full whitespace-nowrap";
  const activeChip = `${buttonVariants({ variant: "primary" })} ${chip}`;
  const idleChip = `${buttonVariants({ variant: "tertiary" })} ${chip}`;

  return (
    <div
      // Same scrolling-chip-row treatment as BlogFilterBar: the pb-3/-mb-2
      // strip (12px pad − 8px margin = the original 4px) plus scrollbar-overlay
      // keep the Windows scrollbar out of the layout. Kept in step with that
      // component — they read as one row to a user moving between the hub and a
      // category page.
      className={`flex flex-nowrap overflow-auto items-center gap-2 p-1 -mx-1 pb-3 -mb-2 scrollbar-overlay ${className}`.trim()}
    >
      {/* "All" is the way back out of a category, so it only appears when
          there's something to clear — on a category page, or on the hub with a
          category filter applied. On the plain hub it would be a link to the
          page you're already on: nothing for a reader, and a self-referential
          link for a crawler. */}
      {activeSlug && (
        <Link href={basePath} className={idleChip}>
          All
        </Link>
      )}
      {categories.map((cat) => (
        <Link
          key={cat.slug}
          href={`${basePath}/category/${cat.slug}`}
          className={cat.slug === activeSlug ? activeChip : idleChip}
          aria-current={cat.slug === activeSlug ? "page" : undefined}
        >
          {cat.name}
        </Link>
      ))}
    </div>
  );
}
