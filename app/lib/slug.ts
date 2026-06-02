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

/** Normalize a comma/Enter-entered tag (lowercase, trimmed, no dup spaces). */
export function normalizeTag(input: string): string {
  return input.trim().replace(/\s+/g, " ").slice(0, 40);
}
