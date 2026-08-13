/**
 * Internal link targets — the pages and articles an author can link to from
 * the post editor (and from the CTA field).
 *
 * Client-safe and dependency-free: the whole set is handed to the editor once
 * and filtered in the browser as the author types. That is a deliberate choice
 * over a per-keystroke server search — the catalogue is a few dozen entries, so
 * shipping it costs a couple of KB and buys instant, offline-capable results
 * with no debounce and no request storm. Revisit if the blog grows into the
 * hundreds, at which point `searchLinkTargets` should move behind a server
 * action (the matcher below can move with it unchanged).
 */

export type LinkTargetKind = "page" | "post";

export interface LinkTarget {
  kind: LinkTargetKind;
  /** Human name shown in the picker — page label or article title. */
  title: string;
  /** Site-relative path, e.g. "/hive/why-a-bee". */
  path: string;
  /** Which blog an article belongs to; absent for static pages. */
  blog?: "hive" | "learn";
}

/** Heading a group of results is shown under. */
export function groupLabel(target: LinkTarget): string {
  if (target.kind === "page") return "Pages";
  return target.blog === "learn" ? "Learn" : "The Hive";
}

/** Group order in the picker: pages first, then the two blogs. */
const GROUP_ORDER = ["Pages", "The Hive", "Learn"];

/**
 * Does any word of the target match this query word?
 *
 * Compared as PREFIXES in both directions, which is what makes the picker
 * usable when the query is a phrase lifted out of a sentence rather than typed
 * at a search box. Prose pluralises: an author writes "our guide to heat
 * pumps" and selects "heat pumps", but the article is titled "…Heat Pump?".
 * Plain substring matching fails there — "pumps" does not occur in "pump" —
 * so the target the author was obviously after simply wouldn't appear.
 *
 *   query "pumps" ⊃ target "pump"   → match (plural in the sentence)
 *   query "sol"   ⊂ target "solar"  → match (still typing)
 *
 * The reverse direction is length-guarded so a stray short word ("a", "to")
 * can't prefix-match everything.
 */
function matchesWord(haystackWords: string[], word: string): boolean {
  return haystackWords.some(
    (candidate) =>
      candidate.startsWith(word) ||
      (candidate.length >= 3 && word.startsWith(candidate)),
  );
}

/**
 * Filter targets by a free-text query, matching on BOTH title and path.
 *
 * Path matching matters more than it looks: an author who knows the URL types
 * "heat-pump" and expects a hit even though the title reads "Should I Upgrade
 * to a Heat Pump?". Hyphens and spaces are therefore treated alike, and every
 * word in the query must appear somewhere — so "solar right" finds "Is Solar
 * Right for My Home?" without depending on word order.
 *
 * An empty query returns everything, which is what makes the picker useful
 * when the author has selected text that matches nothing.
 */
export function searchLinkTargets(
  targets: readonly LinkTarget[],
  query: string,
  options: { excludePath?: string; limit?: number } = {},
): LinkTarget[] {
  const { excludePath, limit = 30 } = options;
  const words = query.toLowerCase().split(/[^a-z0-9]+/i).filter(Boolean);

  const scored: { target: LinkTarget; score: number }[] = [];
  for (const target of targets) {
    // Never offer the article being edited as a link to itself.
    if (excludePath && target.path === excludePath) continue;

    const haystackWords = `${target.title} ${target.path}`
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean);
    if (!words.every((word) => matchesWord(haystackWords, word))) continue;

    // Rank: a title that starts with the query beats one that merely contains
    // it, so typing an exact headline puts it first.
    const title = target.title.toLowerCase();
    const joined = words.join(" ");
    const score = title.startsWith(joined) ? 0 : title.includes(joined) ? 1 : 2;
    scored.push({ target, score });
  }

  return scored
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      const groupDiff =
        GROUP_ORDER.indexOf(groupLabel(a.target)) -
        GROUP_ORDER.indexOf(groupLabel(b.target));
      if (groupDiff !== 0) return groupDiff;
      return a.target.title.localeCompare(b.target.title);
    })
    .slice(0, limit)
    .map((entry) => entry.target);
}
