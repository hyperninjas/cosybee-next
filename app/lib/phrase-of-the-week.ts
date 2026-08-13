/**
 * Phrase of the Week — the footer's small editorial element.
 *
 * One quote, its author, and the article it is paired with. The pairing is
 * editorial: each phrase connects a theme (energy, nature, systems thinking,
 * patience, measurement) to a piece of our own writing, so the footer quietly
 * points at the blog instead of advertising it.
 *
 * ROTATION is deterministic, never random: the ISO-8601 week number selects
 * the entry. Everyone sees the same phrase for a given week, it changes on
 * Monday, and the same date always produces the same result — which is what
 * makes it testable and what stops a page refresh from reshuffling the footer.
 *
 * Client-safe and dependency-free, so both the server render and the browser
 * can derive the same value from a date.
 *
 * ⚠️ Every `article` path must point at a PUBLISHED article. A footer link is
 * on every page of the site, so a wrong slug here is a sitewide 404. All
 * entries below were checked against the live published slug list.
 */

export interface Phrase {
  quote: string;
  author: string;
  /** Site-relative path of the paired article, e.g. "/hive/why-a-bee". */
  article: string;
}

export const PHRASES: readonly Phrase[] = [
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
    quote:
      "When you can measure what you are speaking about, and express it in numbers, you know something about it; but when you cannot measure it, when you cannot express it in numbers, your knowledge is of a meagre and unsatisfactory kind.",
    author: "Lord Kelvin",
    article: "/hive/why-energy-bills-dont-match-epc",
  },
  {
    quote: "Adopt the pace of nature: her secret is patience.",
    author: "Ralph Waldo Emerson",
    article: "/hive/from-waste-to-wisdom",
  },
  {
    quote: "Time is but the stream I go a-fishing in.",
    author: "Henry David Thoreau",
    article: "/learn/am-i-on-the-best-energy-tariff",
  },
  {
    quote:
      "The butterfly counts not months but moments, and has time enough.",
    author: "Rabindranath Tagore",
    article: "/learn/how-to-reduce-heating-energy-waste",
  },
  {
    quote: "Autumn is a second spring when every leaf is a flower.",
    author: "Albert Camus",
    article: "/hive/a-warm-hive-a-cosy-home",
  },
  {
    quote:
      "Those who contemplate the beauty of the earth find reserves of strength that will endure as long as life lasts.",
    author: "Rachel Carson",
    article: "/hive/looking-at-beehives-again-steiner",
  },
  {
    quote:
      "We do not inherit the Earth from our ancestors; we borrow it from our children.",
    author: "Antoine de Saint-Exupéry",
    article: "/learn/should-i-upgrade-to-a-heat-pump",
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
  {
    quote: "Trees are poems that the earth writes upon the sky.",
    author: "Kahlil Gibran",
    article: "/hive/a-warm-hive-a-cosy-home",
  },
  {
    quote:
      "What you do makes a difference, and you have to decide what kind of difference you want to make.",
    author: "Jane Goodall",
    article: "/learn/is-solar-right-for-my-home",
  },
  {
    quote: "It's the little things citizens do. That's what will make the difference.",
    author: "Wangari Maathai",
    article: "/learn/how-to-reduce-heating-energy-waste",
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
 * Index into `PHRASES` for a given date. Exported for the client to recompute
 * (see PhraseOfTheWeek) and to make the rotation directly testable.
 *
 * `"use no memo"` — see `isoWeek`.
 */
export function phraseIndexForDate(date: Date): number {
  "use no memo";
  return (isoWeek(date) - 1) % PHRASES.length;
}

/**
 * The phrase for a given date. Falls back to the first entry rather than
 * returning undefined — the footer renders on every page, so an out-of-range
 * index must degrade to a real quote, never to a blank block.
 *
 * `"use no memo"` — see `isoWeek`.
 */
export function phraseForDate(date: Date): Phrase {
  "use no memo";
  return PHRASES[phraseIndexForDate(date)] ?? PHRASES[0];
}
