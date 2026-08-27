import type { Metadata } from "next";
import { pageMetadata } from "@/app/lib/seo";
import JsonLd from "@/app/components/JsonLd";
import { breadcrumbSchema } from "@/app/lib/structured-data";
import { Container } from "@/app/components/ui/Container";
import { Section } from "@/app/components/ui/Section";
import {
  DailyCostCard,
  DashboardHeader,
  EnergyFlowDiagram,
  PowerHistoryChart,
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
 * theme tokens (`--foreground`, `--surface`, `--success`, `--efh-*`), so
 * the dashboard follows whichever theme the visitor picked. Light mode is
 * tuned in globals.css with darker channel values so tinted labels stay
 * readable on white.
 */
export default function EnergyFlowHomePage() {
  const data = getDashboardData();
  // `now` is captured once here so every child receives the same clock —
  // avoids per-component `new Date()` calls that would fight hydration and
  // makes relative timestamps (e.g. "3 min ago") deterministic per render.
  const now = new Date();

  return (
    <div className="efh-scope bg-background text-foreground">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Energy Flow Dashboard", path: "/energyflow-home" },
        ])}
      />
      <Section spacing="md" surface="base">
        <Container size="wide" className="flex flex-col gap-4">
          <DashboardHeader
            achievement={data.achievement}
            dayLabel={data.dayLabel}
          />
          {/* Two-column layout. `lg:items-stretch` forces both columns to
              share the tallest row's height so the right column can no
              longer end short of the flow diagram. Inside the right column
              we use `grid-rows-[auto_1fr]` so the tariff card sizes to its
              content and the daily-cost card absorbs whatever height is
              left over — matches the reference layout. */}
          <div className="grid gap-4 lg:grid-cols-3 lg:items-stretch">
            <div className="lg:col-span-2 flex">
              <EnergyFlowDiagram flow={data.flow} now={now} />
            </div>
            <div className="grid gap-4 lg:grid-rows-[auto_1fr]">
              <TariffCard tariff={data.tariff} />
              <DailyCostCard cost={data.cost} />
            </div>
          </div>
          <StatStrip stats={data.stats} />
          <PowerHistoryChart history={data.history} />
        </Container>
      </Section>
    </div>
  );
}
