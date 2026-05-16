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

export const SITE_NAME = "energiebee";

export const SITE_TAGLINE = "Smart home energy control that pays for itself";

export const SITE_DESCRIPTION =
  "Energiebee connects every device in your home to one intelligent app — solar forecasting, smart heating, energy analytics, and automated optimisation. Save up to £300/year vs tado.";

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

export const ORG_LEGAL_NAME = "Energiebee Limited";
export const ORG_ADDRESS = {
  street: "4 Blackburn Road",
  city: "Accrington",
  region: "England",
  postalCode: "BB5 1HD",
  country: "GB",
};

export const ORG_CONTACT_EMAIL = "hello@energiebee.com";

export const SOCIAL = {
  facebook: "https://facebook.com/energiebee",
  instagram: "https://instagram.com/energiebee",
  linkedin: "https://linkedin.com/company/energiebee",
  youtube: "https://youtube.com/@energiebee",
} as const;

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
