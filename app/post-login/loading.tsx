import { Spinner } from "@heroui/react";

/**
 * Loading fallback for /post-login. The page itself only resolves the session
 * and redirects (admins → dashboard, others → home), so it renders no markup —
 * this spinner is what the user briefly sees while that server-side lookup and
 * the onward redirect happen.
 */
export default function PostLoginLoading() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Spinner size="lg" aria-label="Signing you in…" />
    </div>
  );
}
