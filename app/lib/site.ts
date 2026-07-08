/**
 * Single source of truth for site-wide SEO/identity values.
 * Used by layout metadata, sitemap, robots, manifest, OG images, and JSON-LD.
 *
 * Override `SITE_URL` per-environment via `NEXT_PUBLIC_SITE_URL` so links
 * and canonicals point at the right host on staging vs production.
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://energiebee.com"
).replace(/\/$/, "");

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
  street: "UK Electronics, Fitton St, Royton",
  city: "Oldham",
  region: "England",
  postalCode: "OL2 5JX",
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

/** All public routes — keep in sync with the page.tsx files under app/. Used by sitemap. */
export const ROUTES: ReadonlyArray<{
  path: string;
  changeFrequency: "daily" | "weekly" | "monthly" | "yearly";
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1.0 },
  { path: "/smart", changeFrequency: "monthly", priority: 0.9 },
  { path: "/heating", changeFrequency: "monthly", priority: 0.9 },
  { path: "/solar", changeFrequency: "monthly", priority: 0.9 },
  { path: "/energy", changeFrequency: "monthly", priority: 0.9 },
  { path: "/hive", changeFrequency: "weekly", priority: 0.8 },
  { path: "/learn", changeFrequency: "weekly", priority: 0.8 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.5 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/cookies", changeFrequency: "yearly", priority: 0.3 },
  { path: "/data-security", changeFrequency: "yearly", priority: 0.3 },
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
