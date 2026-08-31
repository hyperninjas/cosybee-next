import type { Metadata } from "next";
import { pageMetadata } from "@/app/lib/seo";
import JsonLd from "@/app/components/JsonLd";
import { breadcrumbSchema } from "@/app/lib/structured-data";
import { Container } from "@/app/components/ui/Container";
import { Section } from "@/app/components/ui/Section";
import { requireUser } from "@/app/lib/server-session";
import { getConnectionState } from "@/app/lib/connection-state";
import { getActiveProperty, listProperties } from "@/app/lib/property-state";
import type { ActiveProperty } from "@/app/lib/property-state";
import { getLiveDashboardData } from "@/app/lib/dashboard-data";
import type { EnergyFlowFetchResult } from "@/app/lib/energy-flow";
import type { DashboardData } from "@/app/components/sections/energyflow-home";
import {
  ConnectionEmptyState,
  DailyCostCard,
  DashboardHeader,
  EnergyFlowDiagram,
  EnergyFlowDiagramLive,
  PowerHistoryChart,
  ProviderStatusBar,
  StatStrip,
  TariffCard,
  getDashboardData,
} from "@/app/components/sections/energyflow-home";

export const metadata: Metadata = pageMetadata({
  title: "Energy Flow Dashboard",
  description:
    "Live view of solar, battery, grid, and home energy movement — see how your home balances every watt in real time.",
  path: "/energyflow-home",
});

/**
 * `/energyflow-home` — public dashboard view. Composed from the
 * `sections/energyflow-home` module: the page owns nothing but layout and
 * data fetching, so future work (live data, per-day navigation, additional
 * panels) happens inside the module without touching this file.
 *
 * The wrapper carries `efh-scope` (activates the dashboard's channel
 * palette) but no forced theme class — every color routes through semantic
 * theme tokens (--foreground, --surface, --success, efh channel vars), so
 * the dashboard follows whichever theme the visitor picked. Light mode is
 * tuned in globals.css with darker channel values so tinted labels stay
 * readable on white.
 */
/**
 * Four render paths this page picks between, evaluated in order:
 *
 *   1. Not logged in            → `requireUser()` redirects to `/login`.
 *   2. `?demo=1`                → hardcoded demo dashboard (design / marketing
 *                                 preview; kept for when a real user has no
 *                                 data yet but a stakeholder wants to see
 *                                 what the connected experience will look
 *                                 like).
 *   3. No SunSync, no Octopus   → Tier-0 empty state with modal CTAs.
 *   4. At least one connected   → real dashboard (still using hardcoded
 *                                 data at this stage; the next commit
 *                                 replaces `getDashboardData()` with a live
 *                                 backend fetch).
 *
 * Partial connections (SunSync-only or Octopus-only) still land on the
 * real dashboard for now — the section components will surface "Add your
 * Octopus tariff to unlock cost" affordances once real data is wired.
 */
export default async function EnergyFlowHomePage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const { demo } = await searchParams;
  const showDemo = demo === "1";

  // Redirects to /login when there's no session. We pass the current path
  // through the `redirect` query so the user lands back here after signing
  // in rather than on the site's home page.
  await requireUser("/energyflow-home");

  const wrapper = (children: React.ReactNode) => (
    <div className="efh-scope bg-background text-foreground">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Energy Flow Dashboard", path: "/energyflow-home" },
        ])}
      />
      <Section spacing="md" surface="base">
        <Container size="wide">{children}</Container>
      </Section>
    </div>
  );

  if (showDemo)
    return wrapper(
      <DemoDashboard
        data={getDashboardData()}
        flowLive={false}
        flowResult={null}
        properties={[]}
        activePropertyId={null}
      />,
    );

  // Real connection state — one round-trip to each provider status endpoint,
  // memoised so re-reads within this render don't hit the backend twice.
  // Property state runs alongside so the empty state can gate the provider
  // step on whether the user has a home configured yet.
  const [{ sunsync, octopus }, property, properties] = await Promise.all([
    getConnectionState(),
    getActiveProperty(),
    listProperties(),
  ]);
  const anyConnected = sunsync.connected || octopus.connected;

  if (!anyConnected)
    return wrapper(
      <ConnectionEmptyState demoHref="?demo=1" hasProperty={property !== null} />,
    );

  // Live data — SunSync's power flow overwrites the demo snapshot when
  // available; the rest of the cards keep their placeholder values with a
  // "still connecting" note until their endpoint mappings land.
  const { data, liveFields, activePropertyId } = await getLiveDashboardData();
  const stillSyncing =
    !liveFields.tariff ||
    !liveFields.cost ||
    !liveFields.stats ||
    !liveFields.history;

  return wrapper(
    <div className="flex flex-col gap-4">
      {/* Persistent connections strip — makes the second provider reachable
          from inside the connected tier. Without this the dashboard hid
          the Connect CTAs once ANY provider was linked, which meant you
          could connect Octopus first and then have no way to add SunSync
          from the page. */}
      <ProviderStatusBar sunsync={sunsync} octopus={octopus} />

      {stillSyncing && (
        <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning-foreground">
          <span className="mt-0.5 inline-block size-2 shrink-0 rounded-full bg-warning" />
          <span>
            {liveFields.flow.live ? "Showing live power flow. " : ""}Tariff,
            cost, stats and history are still on demo values while we finish
            wiring those to your account.
          </span>
        </div>
      )}
      <DemoDashboard
        data={data}
        flowLive={liveFields.flow.live}
        flowResult={liveFields.flow.result}
        properties={properties}
        activePropertyId={activePropertyId}
      />
    </div>,
  );
}

/**
 * The connected-state dashboard. Renamed argument-wise so the same layout
 * serves both the hardcoded demo (?demo=1) and the live data path — the
 * only difference between them is where `data` came from.
 *
 * `flowLive` picks the live client wrapper (which polls the aggregated
 * `/api/energy-profile/energy-flow` and updates in place) vs the pure server
 * render (used by the demo, where polling would just re-fetch the same fake
 * numbers).
 */
function DemoDashboard({
  data,
  flowLive,
  flowResult,
  properties,
  activePropertyId,
}: {
  data: DashboardData;
  flowLive: boolean;
  flowResult: EnergyFlowFetchResult | null;
  properties: ActiveProperty[];
  activePropertyId: string | null;
}) {
  // `now` is captured once here so every child receives the same clock —
  // avoids per-component `new Date()` calls that would fight hydration and
  // makes relative timestamps (e.g. "3 min ago") deterministic per render.
  const now = new Date();

  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader
        achievement={data.achievement}
        dayLabel={data.dayLabel}
        properties={properties}
        activePropertyId={activePropertyId}
      />
      {/* Two-column layout. `lg:items-stretch` forces both columns to
          share the tallest row's height so the right column can no
          longer end short of the flow diagram. Inside the right column
          we use `grid-rows-[auto_1fr]` so the tariff card sizes to its
          content and the daily-cost card absorbs whatever height is
          left over — matches the reference layout. */}
      <div className="grid gap-4 lg:grid-cols-3 lg:items-stretch">
        <div className="lg:col-span-2 flex">
          {flowLive ? (
            <EnergyFlowDiagramLive initial={data.flow} initialResult={flowResult} />
          ) : flowResult !== null ? (
            // We tried to fetch and got a specific failure — show the client
            // wrapper anyway so it renders the accurate unavailable reason
            // AND keeps polling in case the failure is transient (e.g. the
            // inverter is minutes away from its first reading). Passing
            // `initial={null}` triggers the UnavailableCard branch.
            <EnergyFlowDiagramLive initial={null} initialResult={flowResult} />
          ) : (
            // No fetch was attempted (demo path). Static render, no polling.
            <EnergyFlowDiagram flow={data.flow} now={now} />
          )}
        </div>
        <div className="grid gap-4 lg:grid-rows-[auto_1fr]">
          <TariffCard tariff={data.tariff} />
          <DailyCostCard cost={data.cost} />
        </div>
      </div>
      <StatStrip stats={data.stats} />
      <PowerHistoryChart history={data.history} />
    </div>
  );
}
