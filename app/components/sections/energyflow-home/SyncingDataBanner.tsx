"use client";
"use no memo";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Spinner } from "@heroui/react";
import { ArrowRotateRight } from "@gravity-ui/icons";

/**
 * Post-connect data-load banner.
 *
 * When a customer freshly links Sunsynk, the backend fires three
 * fire-and-forget backfill jobs — live telemetry, 24-month daily totals,
 * and 90 days of 5-minute intraday samples. The intraday backfill in
 * particular can take several minutes and produces the "why are all my
 * numbers zero?" experience: connection status says Connected, tiles say
 * 0.0 kWh, the chart has one dot. Without this banner the customer reads
 * it as "the integration is broken", not "we're still fetching your data".
 *
 * ### When it shows
 *
 * The parent page decides — it renders the banner only when it has a
 * clear signal that data is missing because of backfill, not because the
 * customer genuinely has no readings. Keep the trigger conservative: a
 * genuine dead inverter (a stove-only day, an outage) also produces
 * zeroes, and telling that customer "your data is loading" would be a
 * lie. The `show` prop is the parent's decision.
 *
 * ### Auto-refresh
 *
 * Polls the page every `refreshIntervalMs` (default 45 s) while shown, so
 * the banner disappears on its own the moment the backend catches up.
 * Router.refresh() re-runs the server component's fetches without a full
 * page reload, so scroll position and modal state survive. The customer
 * can also refresh manually via the button; both do the same thing.
 */

interface Props {
  /** Milliseconds between auto-refreshes while the banner is up. */
  refreshIntervalMs?: number;
}

export function SyncingDataBanner({ refreshIntervalMs = 45_000 }: Props) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      router.refresh();
    }, refreshIntervalMs);
    return () => clearInterval(t);
  }, [router, refreshIntervalMs]);

  const handleRefresh = () => {
    setRefreshing(true);
    router.refresh();
    // Router.refresh returns immediately (the network fetch happens
    // asynchronously in the background). Reset the spinner shortly so the
    // button doesn't stay stuck if the fetch is fast; the auto-refresh
    // above continues silently in the background either way.
    setTimeout(() => setRefreshing(false), 1500);
  };

  return (
    <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-warning-foreground">
      <Spinner size="sm" className="mt-0.5" />
      <div className="flex-1">
        <p className="font-semibold">Loading your Sunsynk data…</p>
        <p className="mt-0.5 text-warning-foreground/85">
          Your inverter is linked. We&rsquo;re now syncing up to 90 days of
          history from Sunsynk — the tiles and chart will fill in as the
          readings arrive. This usually takes a few minutes on the first
          connection, and the page refreshes on its own while you wait.
        </p>
      </div>
      <Button
        variant="tertiary"
        size="sm"
        onPress={handleRefresh}
        isDisabled={refreshing}
      >
        <ArrowRotateRight className="mr-1.5 size-4" />
        {refreshing ? "Refreshing…" : "Refresh"}
      </Button>
    </div>
  );
}
