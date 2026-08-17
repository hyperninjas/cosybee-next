/**
 * Phrase of the Week — the footer's small editorial element.
 *
 * One quote, its author, and the article it is paired with. The pairing is
 * editorial: each phrase connects a theme (energy, nature, systems thinking,
 * patience, measurement) to a piece of our own writing, so the footer quietly
 * points at the blog instead of advertising it.
 *
 * The rotation is ADMIN-CURATED: the list, its order, and which entries are in
 * play all come from the backend (`GET /api/phrases`, admin UI at
 * /admin/phrases). `FALLBACK_PHRASES` below is the list this feature shipped
 * with, kept only for the case where that read fails — see its own note.
 *
 * ROTATION is deterministic, never random: the ISO-8601 week number selects
 * the entry. Everyone sees the same phrase for a given week, it changes on
 * Monday, and the same date always produces the same result — which is what
 * makes it testable and what stops a page refresh from reshuffling the footer.
 *
 * Client-safe and dependency-free, so both the server render and the browser
 * can derive the same value from a date.
 */

export interface Phrase {
  quote: string;
  author: string;
  /** Site-relative path of the paired article, e.g. "/hive/why-a-bee". */
  article: string;
}

/**
 * Last-resort rotation, used only when the API returns nothing.
 *
 * The footer is on every page, so a phrase block that can go blank is a
 * sitewide regression the first time the backend hiccups. These entries are the
 * ones the database was seeded with, and every path points at a published,
 * evergreen page — so the fallback degrades to real content, not a placeholder.
 *
 * ⚠️ Every `article` path must point at a PUBLISHED page. A wrong slug here is
 * a sitewide 404. (The admin form picks from published targets, so this
 * constraint only ever needs hand-checking for the entries below.)
 */
export const FALLBACK_PHRASES: readonly Phrase[] = [
  {
    quote:
      "We can only see a short distance ahead, but we can see plenty there that needs to be done.",
    author: "Alan Turing",
    article: "/hive/the-big-picture-smarter-uk",
  },
  {
    quote:
      "Nothing is too wonderful to be true, if it be consistent with the laws of nature.",
    author: "Michael Faraday",
    article: "/hive/understanding-solar-energy",
  },
  {
    quote: "Adopt the pace of nature: her secret is patience.",
    author: "Ralph Waldo Emerson",
    article: "/hive/from-waste-to-wisdom",
  },
  {
    quote: "Look deep into nature, and then you will understand everything better.",
    author: "Albert Einstein",
    article: "/hive/why-a-bee",
  },
  {
    quote: "Nature does not hurry, yet everything is accomplished.",
    author: "Lao Tzu",
    article: "/learn/is-solar-right-for-my-home",
  },
];

/**
 * ISO-8601 week number (1–53) for a date.
 *
 * ISO weeks start on Monday, and week 1 is the week containing the year's
 * first Thursday — so the rotation turns over at Monday 00:00 rather than
 * mid-week. Computed in UTC throughout: deriving it from local time would let
 * two visitors in different timezones see different phrases on the same day,
 * and would make the value depend on where the server happens to run.
 *
 * `"use no memo"` opts this out of the React Compiler. Under
 * `compilationMode: "all"` the compiler injects a `useMemoCache` hook into
 * top-level functions; this one is called from an effect (not during render),
 * where that injected hook would throw "Invalid hook call".
 */
export function isoWeek(date: Date): number {
  "use no memo";
  // Midnight UTC on the same calendar day, so time-of-day can't shift the week.
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  // ISO days run Monday=1..Sunday=7 (getUTCDay gives Sunday=0).
  const isoDay = d.getUTCDay() || 7;
  // Step to the Thursday of this week — the day that decides which ISO year
  // and week the whole week belongs to.
  d.setUTCDate(d.getUTCDate() + 4 - isoDay);
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart) / 86_400_000 + 1) / 7);
}

/**
 * Index into a rotation of `length` entries for a given date. Exported for the
 * client to recompute (see PhraseOfTheWeek) and to make the rotation directly
 * testable.
 *
 * Guards `length <= 0` because the list is now editable: an admin who
 * deactivates every phrase would otherwise produce `% 0` → NaN, and NaN as an
 * array index is `undefined` on every page of the site.
 *
 * `"use no memo"` — see `isoWeek`.
 */
export function phraseIndexForDate(date: Date, length: number): number {
  "use no memo";
  if (length <= 0) return 0;
  return (isoWeek(date) - 1) % length;
}

/**
 * The phrase for a given date, out of a supplied rotation. Falls back to the
 * first entry rather than returning undefined — the footer renders on every
 * page, so an out-of-range index must degrade to a real quote, never to a
 * blank block.
 *
 * `"use no memo"` — see `isoWeek`.
 */
export function phraseForDate(
  date: Date,
  phrases: readonly Phrase[] = FALLBACK_PHRASES,
): Phrase | undefined {
  "use no memo";
  const list = phrases.length > 0 ? phrases : FALLBACK_PHRASES;
  return list[phraseIndexForDate(date, list.length)] ?? list[0];
}
