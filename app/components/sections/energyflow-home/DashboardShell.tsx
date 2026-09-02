"use client";

import { useEffect, useRef, useState } from "react";
import type { ActiveProperty } from "@/app/lib/property-state";
import type { EnergyFlowFetchResult } from "@/app/lib/energy-flow";
import { integratePoints } from "@/app/lib/history-integration";
import { buildLiveStats, findPeakSolar } from "@/app/lib/live-stats";
import { DailyCostCard } from "./DailyCostCard";
import { DashboardHeader } from "./DashboardHeader";
import { EnergyFlowDiagram } from "./EnergyFlowDiagram";
import { EnergyFlowDiagramLive } from "./EnergyFlowDiagramLive";
import { PowerHistoryChart } from "./PowerHistoryChart";
import { StatStrip } from "./StatStrip";
import { TariffCard } from "./TariffCard";
import type { DashboardData, PowerHistory, StatTile } from "./types";

/**
 * Connected-tier client shell.
 *
 * Owns the SELECTED DAY state — one source of truth that:
 *   • Feeds {@link DashboardHeader}'s navigator (prev / calendar / next).
 *   • Redraws {@link StatStrip} + {@link PowerHistoryChart} for that day.
 *   • Swaps the flow diagram for a "flow is live for today only" note
 *     when the selected day isn't today, so a customer looking at 15 May
 *     doesn't misread "right now" numbers above yesterday's totals.
 *
 * ### Fetch flow
 *
 * Initial paint uses the server-fetched today's data (`initialHistory` +
 * `initialStats`), so nothing is deferred to the client on first load.
 * When the user picks a different day, we hit
 * `/api/dashboard/history?date=YYYY-MM-DD` ONCE — the same points populate
 * both the chart AND the stats strip (via {@link integratePoints}), so the
 * two never disagree.
 *
 * ### Why the client integrates
 *
 * The backend's `todayMix` is fixed to today, so past-day totals have to
 * come from somewhere. Adding a "totals for date X" endpoint duplicates
 * the backend's reconciliation and lets it diverge from what the chart
 * shows. Summing kW × dt across the same points the chart draws keeps the
 * strip and the chart in exact agreement — one source, one integration.
 */

/**
 * Route-handler response shape. Mirrors `PowerHistoryFetchResult` in
 * app/lib/sunsync-history.ts; kept local so the client bundle doesn't
 * import the server-only module.
 */
type FetchResult =
  | { status: "ok"; points: PowerHistory["points"] }
  | { status: "no-property" }
  | { status: "no-data" }
  | { status: "out-of-range" }
  | { status: "http-error"; code: number }
  | { status: "network-error" };

interface Props {
  data: DashboardData;
  flowLive: boolean;
  flowResult: EnergyFlowFetchResult | null;
  properties: ActiveProperty[];
  activePropertyId: string | null;
  historyLive: boolean;
  todayIso: string;
}

export function DashboardShell({
  data,
  flowLive,
  flowResult,
  properties,
  activePropertyId,
  historyLive,
  todayIso,
}: Props) {
  const [dayIso, setDayIso] = useState<string>(todayIso);
  const [history, setHistory] = useState<PowerHistory | null>(
    historyLive ? data.history : null,
  );
  const [stats, setStats] = useState<StatTile[]>(data.stats);
  const [historyStatus, setHistoryStatus] = useState<FetchResult["status"] | null>(
    historyLive ? "ok" : null,
  );
  const [pending, setPending] = useState(false);

  const isToday = dayIso === todayIso;

  // `now` is captured once here so every child receives the same clock —
  // avoids per-component `new Date()` calls that would fight hydration.
  const now = new Date();

  // Server already rendered today — skip the mount fetch that would just
  // replay that request. The ref only carries "we're mounting with today"
  // past the first effect run.
  const skipInitialFetchRef = useRef<boolean>(
    dayIso === todayIso && historyLive,
  );

  useEffect(() => {
    if (skipInitialFetchRef.current) {
      skipInitialFetchRef.current = false;
      return;
    }
    // Guards a slow fetch resolving after the user clicked to another day.
    let cancelled = false;
    setPending(true);
    (async () => {
      let body: FetchResult;
      try {
        const res = await fetch(
          `/api/dashboard/history?date=${encodeURIComponent(dayIso)}`,
          { cache: "no-store" },
        );
        body = (await res.json()) as FetchResult;
      } catch {
        body = { status: "network-error" };
      }
      if (cancelled) return;
      setHistoryStatus(body.status);
      if (body.status === "ok") {
        setHistory({
          points: body.points,
          windowLabel:
            dayIso === todayIso ? "Today" : formatDayLabel(dayIso),
        });
        setStats(
          buildLiveStats(
            integratePoints(body.points),
            findPeakSolar(body.points),
          ),
        );
      } else {
        setHistory(null);
        // Blank the strip too — showing yesterday's numbers next to an
        // empty chart reads as "we forgot to update the strip".
        setStats(emptyStats());
      }
      setPending(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [dayIso, todayIso]);

  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader
        achievement={data.achievement}
        dayLabel={data.dayLabel}
        properties={properties}
        activePropertyId={activePropertyId}
        dayIso={dayIso}
        todayIso={todayIso}
        onDayChange={setDayIso}
        isBusy={pending}
      />

      <div className="grid gap-4 lg:grid-cols-3 lg:items-stretch">
        <div className="lg:col-span-2 flex">
          {isToday ? (
            flowLive ? (
              <EnergyFlowDiagramLive
                initial={data.flow}
                initialResult={flowResult}
              />
            ) : flowResult !== null ? (
              // We tried and got a specific failure — the client wrapper
              // renders the accurate unavailable reason AND keeps polling
              // in case the failure is transient. Passing initial={null}
              // triggers the UnavailableCard branch.
              <EnergyFlowDiagramLive initial={null} initialResult={flowResult} />
            ) : (
              // Static (no polling), typically the ?demo=1 preview.
              <EnergyFlowDiagram flow={data.flow} now={now} />
            )
          ) : (
            <PastDayFlowNotice
              dayIso={dayIso}
              onBackToToday={() => setDayIso(todayIso)}
            />
          )}
        </div>
        <div className="grid gap-4 lg:grid-rows-[auto_1fr]">
          <TariffCard tariff={data.tariff} />
          <DailyCostCard cost={data.cost} />
        </div>
      </div>

      <StatStrip stats={stats} />

      {history ? (
        <PowerHistoryChart history={history} />
      ) : (
        <EmptyHistoryCard status={historyStatus} pending={pending} />
      )}
    </div>
  );
}

// ── Past-day notice for the flow slot ────────────────────────────────────

/**
 * Shown in place of the live flow diagram when the customer is browsing a
 * past day. Not a hard error — the surrounding page is functional, this
 * is just an honest "there's no live diagram for the past" with a way
 * back to today.
 */
function PastDayFlowNotice({
  dayIso,
  onBackToToday,
}: {
  dayIso: string;
  onBackToToday: () => void;
}) {
  return (
    <div className="flex w-full flex-col items-start justify-center gap-3 rounded-2xl border border-border bg-surface p-6">
      <div className="text-base font-semibold text-foreground">
        Live flow shows today only
      </div>
      <p className="text-sm text-muted">
        You&rsquo;re viewing <span className="font-medium">{formatDayLabel(dayIso)}</span>.
        The stats and chart below show that day. The energy-flow diagram
        is a live snapshot and only exists for right now.
      </p>
      <button
        type="button"
        onClick={onBackToToday}
        className="text-sm font-semibold text-primary underline underline-offset-4 hover:no-underline"
      >
        Back to today
      </button>
    </div>
  );
}

// ── Empty-state card for the history chart ───────────────────────────────

function EmptyHistoryCard({
  status,
  pending,
}: {
  status: FetchResult["status"] | null;
  pending: boolean;
}) {
  const message = pending
    ? "Loading readings…"
    : status === null
      ? "No readings for this day."
      : messageFor(status);
  return (
    <div className="flex h-72 items-center justify-center rounded-xl border border-border bg-surface p-6 text-sm text-muted">
      {message}
    </div>
  );
}

function messageFor(status: FetchResult["status"]): string {
  switch (status) {
    case "ok":
      return "No readings for this day.";
    case "no-data":
      return "The inverter didn't report on this day.";
    case "no-property":
      return "Pick a home first, then try again.";
    case "out-of-range":
      return "That day is outside the 90-day retention window.";
    case "http-error":
      return "The history service didn't respond. Try again in a moment.";
    case "network-error":
      return "Couldn't reach the history service.";
  }
}

// ── Formatting + placeholders ────────────────────────────────────────────

/** e.g. "15 May". Shared with DashboardHeader — see there for the format. */
function formatDayLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/**
 * Blank tiles keeping the same order/tones as the populated strip, so the
 * layout doesn't reflow on a past-day fetch that failed. Values render as
 * em-dashes so the customer knows the numbers aren't zero.
 */
function emptyStats(): StatTile[] {
  return [
    { key: "solar", label: "Solar Gen", value: "—", unit: "kWh", tone: "solar" },
    {
      key: "grid-import",
      label: "Grid Import",
      value: "—",
      unit: "kWh",
      tone: "grid-import",
    },
    {
      key: "battery",
      label: "Battery",
      value: "— / —",
      unit: "kWh",
      sub: "Charged / Discharged",
      tone: "battery",
    },
    { key: "home", label: "Home Usage", value: "—", unit: "kWh", tone: "home" },
    {
      key: "grid-export",
      label: "Grid Export",
      value: "—",
      unit: "kWh",
      tone: "grid-export",
    },
  ];
}
