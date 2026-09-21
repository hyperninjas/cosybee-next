import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { realTimeToSnapshot } from "./energy-flow.ts";

/**
 * The modelled-guard is the whole reason this file has a test at all: when
 * this reader was wired up, the `realTime` block was treated as ground
 * truth and the backend's three "this is synthetic" signals
 * (`isSimulated`, `source: "simulated"`, `provenance.realTime: "modelled"`)
 * were silently discarded — the dashboard then rendered curve-derived
 * watts alongside a green "Updated just now" chip.
 *
 * These tests pin the reader to the backend's contract: any of the three
 * flags is sufficient to refuse the block, and none of them being set
 * still produces a snapshot from measured inputs.
 */
describe("realTimeToSnapshot — modelled guard", () => {
  const MEASURED_BLOCK = {
    solarKw: 4.82,
    houseKw: 2.22,
    gridKw: -1.36,
    batteryKw: -1.24,
    batteryPercent: 78,
    measuredAt: "2026-09-21T09:55:00.000Z",
  };

  test("returns a snapshot when nothing signals modelled data", () => {
    const snap = realTimeToSnapshot({
      realTime: MEASURED_BLOCK,
      timestamp: "2026-09-21T09:55:12.000Z",
    });

    assert.notEqual(snap, null);
    // Sanity: the numbers survived the kW→W conversion and the sign
    // conventions the callers depend on downstream. If this ever fails,
    // the guard has almost certainly started rejecting measured data too.
    assert.equal(snap?.solar.watts, 4820);
    assert.equal(snap?.home.watts, 2220);
  });

  test("returns null when `isSimulated: true`", () => {
    const snap = realTimeToSnapshot({
      realTime: MEASURED_BLOCK,
      timestamp: "2026-09-21T09:55:12.000Z",
      isSimulated: true,
    });
    assert.equal(snap, null);
  });

  test("returns null when `source: \"simulated\"`", () => {
    const snap = realTimeToSnapshot({
      realTime: MEASURED_BLOCK,
      timestamp: "2026-09-21T09:55:12.000Z",
      source: "simulated",
    });
    assert.equal(snap, null);
  });

  test("returns null when `provenance.realTime: \"modelled\"`", () => {
    const snap = realTimeToSnapshot({
      realTime: MEASURED_BLOCK,
      timestamp: "2026-09-21T09:55:12.000Z",
      provenance: { realTime: "modelled" },
    });
    assert.equal(snap, null);
  });

  test("still returns a snapshot on `source: \"mixed\"` — measured realtime alongside modelled totals is not the guard's problem", () => {
    // A property with a live inverter but modelled `todayMix` fields
    // (e.g. no export meter yet, so `exportedToGridKwh` is modelled)
    // rolls the payload up to "mixed". The realtime block itself is
    // still measured and MUST render — otherwise the diagram flips off
    // whenever any total is unavailable.
    const snap = realTimeToSnapshot({
      realTime: MEASURED_BLOCK,
      timestamp: "2026-09-21T09:55:12.000Z",
      source: "mixed",
      provenance: { realTime: "measured" },
    });
    assert.notEqual(snap, null);
  });

  test("still returns a snapshot on `provenance.realTime: \"unavailable\"` — the caller handles that as an empty state via missing fields, not via the guard", () => {
    // `unavailable` is a distinct case from `modelled`: the endpoint had
    // nothing to say, not a curve pretending to be a reading. Whether
    // the resulting snapshot is useful is decided by the field-presence
    // checks the callers already run — the guard's job is only to catch
    // the synthetic case.
    const snap = realTimeToSnapshot({
      realTime: MEASURED_BLOCK,
      timestamp: "2026-09-21T09:55:12.000Z",
      provenance: { realTime: "unavailable" },
    });
    assert.notEqual(snap, null);
  });

  test("returns null when `realTime` itself is absent, regardless of provenance", () => {
    // Pre-existing behaviour — pinned here so a refactor of the guard
    // can't accidentally start manufacturing a snapshot from nothing.
    const snap = realTimeToSnapshot({
      timestamp: "2026-09-21T09:55:12.000Z",
      provenance: { realTime: "measured" },
    });
    assert.equal(snap, null);
  });
});
