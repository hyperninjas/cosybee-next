/**
 * Sanitise a user-supplied `?redirect=` value so it can only point back into
 * this site. Anything that could navigate off-origin — absolute URLs,
 * protocol-relative (`//evil.com`), or backslash tricks (`/\evil.com`) — is
 * rejected in favour of the fallback. Prevents open-redirect abuse on the
 * login/register flows.
 */
export function safeRedirect(
  target: string | null | undefined,
  fallback = "/account",
): string {
  if (!target) return fallback;
  // Must be a single-slash absolute path on this origin.
  if (
    !target.startsWith("/") ||
    target.startsWith("//") ||
    target.startsWith("/\\")
  ) {
    return fallback;
  }
  return target;
}
