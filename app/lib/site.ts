/**
 * Single source of truth for site-wide SEO/identity values.
 * Used by layout metadata, sitemap, robots, manifest, OG images, and JSON-LD.
 *
 * Override `SITE_URL` per-environment via `NEXT_PUBLIC_SITE_URL` so links
 * and canonicals point at the right host on staging vs production.
 */

/** Canonical production origin. Any deployment whose SITE_URL differs
 *  (sandbox, previews, local) is treated as non-indexable — see IS_PRODUCTION. */
export const PRODUCTION_URL = "https://energiebee.com";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? PRODUCTION_URL
).replace(/\/$/, "");

/**
 * True only on the canonical production host. Everything else — the sandbox,
 * preview deploys, local dev — is non-production and must stay out of search.
 * Gate indexing (robots.txt + the site-wide X-Robots-Tag header in
 * next.config.ts) on this so only production is ever crawled/indexed.
 *
 * Derived from SITE_URL, which each environment already sets via the
 * NEXT_PUBLIC_SITE_URL build arg, so no extra configuration is required.
 */
export const IS_PRODUCTION = SITE_URL === PRODUCTION_URL;

export const SITE_NAME = "EnergieBee";

export const SITE_TAGLINE = "Smart home energy control that pays for itself";

export const SITE_DESCRIPTION =
  "EnergieBee connects every device in your home — solar forecasting, smart heating, and energy analytics in one app. Save up to £300/year vs tado.";

export const SITE_KEYWORDS = [
  "smart home energy",
  "solar forecasting",
  "smart heating",
  "energy monitoring",
  "tado alternative",
  "home energy management",
  "energy savings",
  "smart thermostat",
  "AI energy optimisation",
  "UK smart home",
];

export const ORG_LEGAL_NAME = "EnergieBee Limited";
export const ORG_ADDRESS = {
  street: "The Landmark, 1 School Lane",
  city: "Burnley",
  region: "England",
  postalCode: "BB11 1UF",
  country: "GB",
};

export const ORG_CONTACT_EMAIL = "support@energiebee.com";

export const SOCIAL = {
  facebook: "https://www.facebook.com/EnergieBeeLtd/",
  instagram: "https://www.instagram.com/energiebee/",
  youtube: "https://www.youtube.com/@EnergieBeeLtd",
  linkedin: "https://www.linkedin.com/company/energiebeeltd/",
} as const;

/** X/Twitter @handle used for twitter:site and twitter:creator card tags. */
export const TWITTER_HANDLE = "@EnergieBee";

/**
 * All public routes — keep in sync with the page.tsx files under app/. Used by sitemap.
 *
 * `lastModified` is an ISO date and is OPTIONAL, on purpose. `<lastmod>` is only
 * worth sending when it is true: Google uses it while it stays consistent with
 * what it finds, and discounts it site-wide once it doesn't — which would also
 * cost us the accurate dates on articles. So set it only where the page states
 * its own revision date (the legal pages do, in their footers — keep the two in
 * step), and leave it off everywhere else rather than inventing one.
 *
 * /hive and /learn are the exception the sitemap fills in for free: they are
 * listings, so their newest article IS their modification date.
 */
export const ROUTES: ReadonlyArray<{
  path: string;
  changeFrequency: "daily" | "weekly" | "monthly" | "yearly";
  priority: number;
  /** ISO date, only when the page publishes a revision date of its own. */
  lastModified?: string;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1.0 },
  { path: "/smart", changeFrequency: "monthly", priority: 0.9 },
  { path: "/heating", changeFrequency: "monthly", priority: 0.9 },
  { path: "/solar", changeFrequency: "monthly", priority: 0.9 },
  { path: "/energy", changeFrequency: "monthly", priority: 0.9 },
  { path: "/download-app", changeFrequency: "monthly", priority: 0.8 },
  { path: "/hive", changeFrequency: "weekly", priority: 0.8 },
  { path: "/learn", changeFrequency: "weekly", priority: 0.8 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.5 },
  // Dates below mirror the "Last updated" line each page renders in its footer.
  { path: "/terms", changeFrequency: "yearly", priority: 0.3, lastModified: "2026-05-01" },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3, lastModified: "2026-05-01" },
  { path: "/cookies", changeFrequency: "yearly", priority: 0.3, lastModified: "2026-05-01" },
  { path: "/data-security", changeFrequency: "yearly", priority: 0.3, lastModified: "2026-05-15" },
];

/** Absolute URL helper for sitemaps, canonicals, OG image refs, etc. */
export function url(path: string): string {
  const prefix = path.startsWith("/") ? "" : "/";
  return SITE_URL + prefix + path;
}

/**
 * RSS auto-discovery entry for `metadata.alternates.types`.
 *
 * Next merges metadata *shallowly*, so any page that sets its own `alternates`
 * (article pages, marketing pages via seo.ts) **replaces** the root layout's
 * `alternates` wholesale — dropping this feed link. Spread this into every such
 * page's `alternates` so the blog feed stays discoverable site-wide.
 *
 * Uses the documented string form (`{ type: url }`); the array-of-objects form
 * silently renders nothing in this Next build.
 */
export const RSS_ALTERNATE_TYPES = {
  "application/rss+xml": url("/rss.xml"),
} as const;
