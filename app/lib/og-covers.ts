/**
 * Hero cover photos, reused as Open Graph card backgrounds so a shared link
 * looks like the page it points at. Keys — not paths — travel in the /api/og
 * query string: the route resolves the key against this map, so no caller can
 * point the card renderer at an arbitrary URL.
 *
 * Keep in sync with the `bgImage` each hero imports (PageHero callers, plus
 * HomeHero and DownloadHero, which have bespoke layouts). Pages with no hero
 * photo (FAQ, the legal set) simply have no entry and fall back to the plain
 * gradient card.
 */
export const OG_COVERS = {
  home: "/homepage-images/hero-bg-fallback.png",
  solar: "/Cover/energiebee-solar-cover.png",
  heating: "/Cover/energiebee-heating-cover.png",
  smart: "/Cover/energiebee-smart-cover.png",
  energy: "/Cover/energiebee-energy-cover.png",
  contact: "/Cover/energiebee-contact-cover.png",
  hive: "/Cover/energiebee-hive-cover.png",
  learn: "/Cover/energiebee-learn-cover.png",
  download: "/energibee-hero-image.jpg",
} as const;

export type OgCoverKey = keyof typeof OG_COVERS;

export function isOgCoverKey(value: string): value is OgCoverKey {
  return value in OG_COVERS;
}

/**
 * Longest-prefix path → cover key. Prefixes (not exact paths) so the blog's
 * category, tag and author pages inherit their hub's cover.
 */
const BY_PREFIX: ReadonlyArray<readonly [string, OgCoverKey]> = [
  ["/solar", "solar"],
  ["/heating", "heating"],
  ["/smart", "smart"],
  ["/energy", "energy"],
  ["/contact", "contact"],
  ["/hive", "hive"],
  ["/learn", "learn"],
  ["/download-app", "download"],
];

/** The cover for a canonical page path, or null when the page has no hero photo. */
export function coverKeyForPath(path: string): OgCoverKey | null {
  if (path === "/") return "home";
  const hit = BY_PREFIX.filter(([prefix]) => path.startsWith(prefix)).sort(
    (a, b) => b[0].length - a[0].length,
  )[0];
  return hit ? hit[1] : null;
}
