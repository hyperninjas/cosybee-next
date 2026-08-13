// Pure helpers shared by the admin form (client) and server actions —
// no server imports so it's safe to bundle on the client.

/** Turn arbitrary text into a URL-safe slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Slugify a field that is being TYPED IN, rather than a finished value.
 *
 * `slugify` strips leading and trailing hyphens, which makes it unusable as an
 * `onChange` transform: a hyphen you have just typed is ALWAYS the trailing
 * character, so it is deleted the moment you type it and a dash can never be
 * entered at all. (The only way to produce one is to type a space and then
 * keep going, which is not obvious to anyone.)
 *
 * This keeps a trailing hyphen so a word can be continued, still refuses
 * anything that isn't a slug character, and collapses runs. Pair it with
 * `slugify` on blur/submit to drop a hyphen left dangling at the end.
 */
export function slugifyInput(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+/, ""); // leading hyphens are never wanted; trailing may be
}

/** Normalize a comma/Enter-entered tag (lowercase, trimmed, no dup spaces). */
export function normalizeTag(input: string): string {
  return input.trim().replace(/\s+/g, " ").slice(0, 40);
}
