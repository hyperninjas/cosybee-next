"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Spinner } from "@heroui/react";
import { createPropertyFromEpc } from "@/app/lib/onboarding-actions";

/**
 * "Setting up your home…" spinner shown when the server has already resolved
 * an unambiguous EPC for the picked address. Mirrors the mobile app's flow:
 * a single-EPC (UPRN match, or postcode + clear best-match) auto-continues
 * instead of asking the user to confirm the same choice on the next screen.
 *
 * Fires the create Server Action once on mount (StrictMode-safe via a ref
 * latch — React runs effects twice in dev, and re-firing would create a
 * duplicate property). On success → forwards to the next onboarding step.
 * On failure → surfaces the error inline and offers to try again (rare;
 * covers a transient backend error, not a "user changed their mind" case).
 */
export function AutoCreateProperty({
  certificateNumber,
  nextHref,
}: {
  certificateNumber: string;
  nextHref: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(0);
  // StrictMode double-invokes effects in dev; without this latch the action
  // would fire twice and create two properties on the very first render.
  const firedRef = useRef(false);

  useEffect(() => {
    // StrictMode fires the effect twice with a cleanup between runs. The
    // ref latch survives that cycle (fiber persists), so the first run
    // reserves the fetch and the second early-returns.
    //
    // 🔴 No `cancelled` abort here. An earlier version cancelled the
    // in-flight action on cleanup, which nuked the router.push for the
    // ONE call that actually ran — StrictMode's cleanup fires before the
    // fetch resolves, so both runs ended up as no-ops and the spinner sat
    // forever. Letting router.push always fire is safe: if the user
    // navigated away, pushing to the same href is a no-op; otherwise it
    // advances the funnel as intended.
    if (firedRef.current) return;
    firedRef.current = true;
    void (async () => {
      const result = await createPropertyFromEpc({
        certificateNumber,
        label: "Home",
      });
      // 409 CONFLICT = "You already have an active property at this address"
      // (eb-auth's `PropertyConflictError`). Treat as success — the property
      // is exactly what we would have created, so a stalled "Try again" here
      // would loop the user on a screen with no way out. Just advance.
      if (result.ok || result.code === "CONFLICT") {
        router.push(nextHref);
      } else {
        setError(result.error);
        // Release the latch so the "Try again" button can re-fire it.
        firedRef.current = false;
      }
    })();
  }, [certificateNumber, nextHref, router, retrying]);

  if (error) {
    return (
      <Alert status="danger">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Couldn&apos;t set up your home</Alert.Title>
          <Alert.Description>
            {error}{" "}
            <button
              type="button"
              onClick={() => {
                setError(null);
                setRetrying((n) => n + 1);
              }}
              className="font-semibold underline underline-offset-2"
            >
              Try again
            </button>
          </Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-secondary p-4">
      <Spinner size="sm" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">
          Setting up your home…
        </p>
        <p className="text-xs text-muted">
          We found your EPC. One moment while we finish creating your property.
        </p>
      </div>
    </div>
  );
}
