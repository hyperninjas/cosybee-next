import type { DashboardData, PowerHistoryPoint } from "./types";

/**
 * Deterministic pseudo-random in [0,1). We can't use `Math.random()` because
 * it would produce different values on server and client and blow up
 * hydration; `Math.sin` gives the same output for the same input every
 * time, so we hash (index, seed) → 0..1 via the classic sine-fract trick.
 * Not cryptographic, but perfect for chart demo noise.
 */
function noise(i: number, seed: number): number {
  const x = Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Realistic 24h power curve at 10-minute resolution (144 samples). Real
 * home telemetry has three signatures the reference chart makes visible,
 * and this generator reproduces each one:
 *
 *   • home load — flat 0.5–1.2 kW baseline with sharp appliance spikes
 *     (kettle, oven, EV top-up) that last one or two samples
 *   • solar — smooth bell curve peaking at midday, dented by cloud
 *     wobbles so the daytime hump isn't a clean parabola
 *   • grid — the compensator: negative when solar exceeds house+battery
 *     (export), positive during evening peaks after battery drains
 *   • battery — charges (positive) during the solar surplus window,
 *     discharges (negative) through the evening peak, idle otherwise
 *
 * Deterministic — same output every render, safe for SSR hydration.
 */
function generateHistory(): PowerHistoryPoint[] {
  const STEP_MIN = 10;
  const COUNT = (24 * 60) / STEP_MIN;

  const label = (i: number) => {
    const totalMin = i * STEP_MIN;
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    const period = h < 12 ? "AM" : "PM";
    const hr = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return m === 0 ? `${hr} ${period}` : `${hr}:${String(m).padStart(2, "0")} ${period}`;
  };

  const bell = (h: number, peak: number, spread: number, height: number) =>
    Math.max(0, height * Math.exp(-((h - peak) ** 2) / (2 * spread ** 2)));

  return Array.from({ length: COUNT }, (_, i) => {
    const h = (i * STEP_MIN) / 60;

    // --- Solar ---
    // Bell curve for the day, times a cloud multiplier that dips
    // occasionally. `noise(i, 3)` gives a stable per-sample scalar; we
    // subtract from 1 so most samples stay near full sun with rare dips.
    const cloud = Math.max(0.55, 1 - noise(i, 3) * 0.5);
    const solar = bell(h, 12.5, 2.8, 8.5) * cloud;

    // --- Home load ---
    // Baseline noise + morning/evening bumps + rare appliance spikes.
    const baseline = 0.55 + noise(i, 11) * 0.3;
    const morning = bell(h, 7.5, 1.2, 1.4);
    const evening = bell(h, 19.5, 1.6, 2.2);
    // Spike model: only fire when the noise draw crosses a high threshold,
    // then push a short 3–7 kW burst. Timeouts (via `i % ...`) keep spikes
    // sparse and distributed.
    const spikeSeed = noise(i, 47);
    const spike =
      spikeSeed > 0.94
        ? 3.5 + noise(i, 71) * 4.5
        : spikeSeed > 0.88 && (i % 6 === 0 || i % 7 === 0)
          ? 1.5 + noise(i, 83) * 1.5
          : 0;
    const home = baseline + morning + evening + spike;

    // --- Battery ---
    // Charging window follows the solar peak; discharge window follows the
    // evening load peak. Rate scales with local surplus / demand.
    const surplus = solar - home;
    let battery = 0;
    if (h >= 9.5 && h <= 15.5 && surplus > 0.4) {
      battery = Math.min(4.2, surplus * 0.65);
    } else if (h >= 17 && h <= 22.5 && solar < 0.3) {
      battery = -Math.min(3.5, home * 0.55 + noise(i, 29) * 0.5);
    }

    // --- Grid ---
    // Whatever the house needs that solar + battery can't cover comes from
    // the grid; whatever's left over gets exported (negative). Rounded to
    // two decimals for tooltip readability.
    const grid = home - solar - battery;

    return {
      time: label(i),
      home: +home.toFixed(2),
      solar: +solar.toFixed(2),
      grid: +grid.toFixed(2),
      battery: +battery.toFixed(2),
    };
  });
}

/**
 * Demo snapshot used while the live data source is wired up. When the real
 * feed lands, replace `getDashboardData()` with an async fetch — the section
 * components only depend on the {@link DashboardData} shape, not on where it
 * came from, so nothing else in this module has to change.
 */
export function getDashboardData(): DashboardData {
  return {
    flow: {
      // Midday snapshot: solar is peaking, home load moderate, battery
      // absorbing the surplus, grid exporting the leftover — the "happy
      // Sunday" energy story the reference dashboard tells.
      solar: { watts: 4820, direction: "out" },
      battery: {
        watts: 1240,
        direction: "in",
        soc: 82,
        label: "2 × 5.0 kWh Battery",
      },
      grid: { watts: 1360, direction: "out" },
      home: { watts: 2220, direction: "in" },
      // Green share of the imported grid mix — populates the Low Carbon
      // hex on the flow diagram. Realistic UK midday value (~30% wind
      // + solar + nuclear on a sunny weekday).
      nonFossilPercentage: 30,
      // Individually metered loads. Adding entries here adds a hex to
      // the diagram automatically — no other files need to change.
      individuals: [{ label: "EV", watts: 700 }],
      updatedAt: "2026-08-27T11:52:00Z",
      netLabel: "0.14 kW export",
      netTone: "positive",
    },
    tariff: {
      // Realistic UK figures — Octopus Agile-style import, SEG export
      // rate, standard standing charge. Populates every stat on the card
      // so no field reads as an empty placeholder.
      name: "Octopus Agile",
      importPence: 22.5,
      exportPence: 15.0,
      standingPence: 42.36,
    },
    cost: {
      // Today's running cost with yesterday for the trend chip.
      //   Import (£3.42) − Export (£1.87) + Standing (£0.42) = £1.97
      // Yesterday was £4.12 → chip shows "£2.15 saved".
      netGbp: 1.97,
      prevNetGbp: 4.12,
      importGbp: 3.42,
      standingGbp: 0.42,
      exportCreditGbp: 1.87,
    },
    stats: [
      {
        key: "solar",
        label: "Solar Gen",
        value: "18.4",
        unit: "kWh",
        sub: "Peak 5.2 kW at 12:40",
        tone: "solar",
      },
      {
        key: "grid-import",
        label: "Grid Import",
        value: "3.6",
        unit: "kWh",
        sub: "Peak 1.4 kWh / Off-peak 2.2 kWh",
        tone: "grid-import",
      },
      {
        key: "battery",
        label: "Battery",
        value: "7.8 / 5.4",
        unit: "kWh",
        sub: "Charged / Discharged",
        tone: "battery",
      },
      {
        key: "home",
        label: "Home Usage",
        value: "14.2",
        unit: "kWh",
        sub: "vs 15.8 kWh avg",
        tone: "home",
      },
      {
        key: "grid-export",
        label: "Grid Export",
        value: "9.1",
        unit: "kWh",
        sub: "Export earnings: £1.36",
        tone: "grid-export",
      },
    ],
    history: {
      points: generateHistory(),
      windowLabel: "24h View",
    },
    achievement: {
      title: "Off-Grid Champion",
      message: "You were 100% self-sufficient today!",
    },
    dayIso: "2026-08-27",
    dayLabel: "Today",
  };
}
