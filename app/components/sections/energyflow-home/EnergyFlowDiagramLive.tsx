"use client";

import { useEffect, useRef, useState } from "react";
import { Card, Chip } from "@heroui/react";
import { EnergyFlowDiagram } from "./EnergyFlowDiagram";
import type { EnergyFlowSnapshot } from "./types";
import { freshnessOf, type EnergyFlowFetchResult, type Freshness } from "@/app/lib/energy-flow";

/**
 * Live wrapper around {@link EnergyFlowDiagram}. Owns the polling loop, the
 * freshness ticker, and the ageing caption.
 *
 * The initial paint uses `initial` (server-rendered snapshot from
 * `dashboard-data.ts` — same request that hydrates the rest of the page), so
 * the first frame is instant and identical to what the mobile app would
 * show at that moment. Polling only starts after mount, hits the same-origin
 * route `/api/dashboard/energy-flow`, and updates the snapshot in place.
 *
 * ── Cadence ────────────────────────────────────────────────────────────────
 * The upstream inverter feed refreshes ~every 2 minutes (Sunsynk poll cycle).
 * We poll at 30 s so the "N min ago" caption drifts down promptly and a fresh
 * upstream frame is picked up within one interval of arrival — quicker than
 * mobile's WebSocket in the worst case, but bounded so we don't hammer.
 *
 * ── Freshness ──────────────────────────────────────────────────────────────
 * A separate 30 s ticker updates `now` so the caption stays honest between
 * polls (a poll returning the same `measuredAt` won't advance `updatedAt`,
 * but the age still climbs). Once age crosses 20 min the diagram switches to
 * an offline placeholder — matches mobile's `DataFreshness.offline`.
 *
 * ── Failure reporting ──────────────────────────────────────────────────────
 * A failed poll (network error, no active property, backend down) shows an
 * EXPLICIT unavailable card with the reason — no silent demo-fallback. This
 * was the previous behaviour and it made web-vs-mobile mismatches invisible:
 * the demo snapshot rendered as though it were live, while mobile pulled
 * real data.
 */

const POLL_INTERVAL_MS = 30_000;
const TICK_INTERVAL_MS = 30_000;

interface Props {
  /**
   * Server-rendered starting snapshot (or `null` if the backend refused at
   * SSR time — e.g. no linked inverter yet). The wrapper still mounts and
   * begins polling in the null case, so a linkage completed after page load
   * lights the card up on the next tick.
   */
  initial: EnergyFlowSnapshot | null;
  /**
   * The SSR fetch's result — used to render an accurate empty state when
   * `initial === null` (was it no property? backend down? no reading yet?).
   */
  initialResult: EnergyFlowFetchResult | null;
}

export function EnergyFlowDiagramLive({ initial, initialResult }: Props) {
  const [snapshot, setSnapshot] = useState<EnergyFlowSnapshot | null>(initial);
  const [lastResult, setLastResult] = useState<EnergyFlowFetchResult | null>(initialResult);
  // `now` is state (not a ref) so a tick triggers a re-render — that is how
  // "Updated 3 min ago" advances between polls.
  const [now, setNow] = useState<Date>(() => new Date());
  // Guards against a race where a slow response lands after the component
  // has unmounted (React would warn about setting state on an unmounted
  // component). AbortController on the fetch is a stronger form; this is
  // enough for a GET that never cancels itself.
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function poll(): Promise<void> {
      try {
        const res = await fetch("/api/dashboard/energy-flow", {
          cache: "no-store",
          credentials: "same-origin",
        });
        if (!res.ok) return;
        const body = (await res.json()) as EnergyFlowFetchResult;
        if (cancelled || !alive.current) return;
        setLastResult(body);
        if (body.status === "ok") {
          setSnapshot(body.snapshot);
        } else {
          // Overwrite even on failure: a linkage that got un-linked after
          // page load should reflect immediately, not keep the last-known
          // frame aging forever on the screen.
          setSnapshot(null);
        }
      } catch {
        // Silent — a transient network blip shouldn't blank the diagram; the
        // last successful snapshot ages naturally via the ticker and will hit
        // "offline" on its own if the outage persists.
      }
    }

    const pollHandle = setInterval(() => {
      void poll();
    }, POLL_INTERVAL_MS);
    const tickHandle = setInterval(() => {
      if (!alive.current) return;
      setNow(new Date());
    }, TICK_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(pollHandle);
      clearInterval(tickHandle);
    };
  }, []);

  if (snapshot !== null) {
    const freshness: Freshness = freshnessOf(snapshot.updatedAt, now);
    return <EnergyFlowDiagram flow={snapshot} now={now} freshness={freshness} />;
  }

  // No snapshot — render an explicit unavailable card that says WHY. Never
  // fall back to demo values here (see class doc above).
  return <UnavailableCard result={lastResult} />;
}

/**
 * Empty state shown when there is no snapshot to render. Each failure mode
 * gets its own concrete message so the user (or a support engineer looking
 * at a screenshot) can act on it, rather than seeing a generic "unavailable"
 * that hides which of four unrelated problems it is.
 */
function UnavailableCard({ result }: { result: EnergyFlowFetchResult | null }) {
  const message = messageFor(result);
  return (
    <Card variant="default" className="flex h-full w-full flex-col">
      <Card.Header className="flex-row items-start justify-between gap-2">
        <div>
          <Card.Title>Energy Flow Diagram</Card.Title>
          <Card.Description>Power movement through your home</Card.Description>
        </div>
        <Chip color="default" variant="soft" size="sm">
          <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-default-400 align-middle" />
          Unavailable
        </Chip>
      </Card.Header>
      <Card.Content>
        <div className="rounded-lg border border-dashed border-default-300 p-6 text-center text-sm text-default-500">
          {message}
        </div>
      </Card.Content>
    </Card>
  );
}

function messageFor(result: EnergyFlowFetchResult | null): string {
  if (result === null) return "Live energy flow not available.";
  switch (result.status) {
    case "ok":
      // Unreachable in practice — `snapshot === null` implies non-ok. Kept
      // exhaustive so a future status forces a compile error here first.
      return "Live energy flow not available.";
    case "no-property":
      return "Add a home to your account to see live energy flow.";
    case "no-data":
      return "No inverter reading yet. This can take a few minutes after connecting Sunsynk.";
    case "http-error":
      return `Backend returned an error (HTTP ${result.code}). Try again shortly.`;
    case "network-error":
      return "Could not reach the backend. Check your connection and try again.";
  }
}
