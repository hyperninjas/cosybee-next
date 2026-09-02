"use client";

import { useMemo } from "react";
import {
  Button,
  Calendar,
  Chip,
  DateField,
  DatePicker,
} from "@heroui/react";
import { parseDate, type CalendarDate } from "@internationalized/date";
import { ChevronLeft, ChevronRight, Sun } from "@gravity-ui/icons";
import type { DashboardData } from "./types";
import { PropertySwitcher } from "./PropertySwitcher";
import type { ActiveProperty } from "@/app/lib/property-state";

/**
 * Top strip of the dashboard: page title, optional achievement chip,
 * property switcher (multi-property only — a passive chip for single-
 * property users), and the date navigator.
 *
 * The navigator is CONTROLLED — the day is owned by an ancestor client
 * component ({@link DashboardShell}), because the same day drives the
 * stats strip and the history chart lower on the page. Two navigators
 * (one here, one down there) reads as two separate controls and confuses
 * "which one owns the current day"; one control up top drives everything.
 *
 * `disabled` gates for the arrows and the calendar bound at the SunSync
 * intraday retention wall (90 days back) — matches the wall in
 * `app/lib/sunsync-history.ts`. Absent `todayIso` (the demo path) renders
 * the nav as static text so `?demo=1` still looks like the real dashboard.
 */

/** Matches `HISTORY_RETENTION_DAYS` in app/lib/sunsync-history.ts. */
const RETENTION_DAYS = 90;

interface Props {
  achievement: DashboardData["achievement"];
  /** Fallback label used only when there's no interactive date state. */
  dayLabel: string;
  properties?: ActiveProperty[];
  activePropertyId?: string | null;
  /**
   * Currently-selected day (`YYYY-MM-DD`). Present in the connected tier
   * where `DashboardShell` supplies day state; absent in the demo path.
   */
  dayIso?: string;
  /** Today's UK date. Bounds the "next" arrow / calendar maxValue. */
  todayIso?: string;
  /**
   * Called when the user shifts the day (arrow or calendar pick). Absent
   * in the demo path — the arrows render disabled in that case.
   */
  onDayChange?: (nextIso: string) => void;
  /** Set true while the parent is fetching a new day's data. */
  isBusy?: boolean;
}

export function DashboardHeader({
  achievement,
  dayLabel,
  properties = [],
  activePropertyId = null,
  dayIso,
  todayIso,
  onDayChange,
  isBusy = false,
}: Props) {
  const interactive =
    dayIso !== undefined && todayIso !== undefined && onDayChange !== undefined;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Energy Dashboard
        </h1>
        {achievement && (
          <Chip color="warning" variant="soft" size="md">
            <Sun className="mr-1 inline size-4 align-middle" />
            <span className="font-semibold">{achievement.title}</span>
            <span className="ml-2 text-muted">{achievement.message}</span>
          </Chip>
        )}
        <PropertySwitcher properties={properties} activeId={activePropertyId} />
      </div>

      {interactive ? (
        <InteractiveDayNav
          dayIso={dayIso}
          todayIso={todayIso}
          onDayChange={onDayChange}
          isBusy={isBusy}
        />
      ) : (
        <StaticDayLabel label={dayLabel} />
      )}
    </div>
  );
}

// ── Interactive navigator (connected tier) ───────────────────────────────

/**
 * The prev / calendar / next control. Extracted so the guard for
 * `interactive` in the parent stays one boolean rather than nullable
 * branches on every child prop.
 */
function InteractiveDayNav({
  dayIso,
  todayIso,
  onDayChange,
  isBusy,
}: {
  dayIso: string;
  todayIso: string;
  onDayChange: (nextIso: string) => void;
  isBusy: boolean;
}) {
  const isToday = dayIso === todayIso;
  const minIso = useMemo(
    () => addDaysIso(todayIso, -(RETENTION_DAYS - 1)),
    [todayIso],
  );

  const shiftDay = (deltaDays: number) => {
    const nextIso = addDaysIso(dayIso, deltaDays);
    if (nextIso < minIso || nextIso > todayIso) return;
    onDayChange(nextIso);
  };

  const onCalendarChange = (v: CalendarDate | null) => {
    if (!v) return;
    const iso = v.toString();
    if (iso < minIso || iso > todayIso) return;
    onDayChange(iso);
  };

  const dateValue = safeParseDate(dayIso);
  const minValue = safeParseDate(minIso);
  const maxValue = safeParseDate(todayIso);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="tertiary"
        size="sm"
        isIconOnly
        aria-label="Previous day"
        isDisabled={isBusy || dayIso <= minIso}
        onPress={() => shiftDay(-1)}
      >
        <ChevronLeft className="size-4" />
      </Button>

      {dateValue && minValue && maxValue ? (
        <DatePicker
          aria-label="Pick a day"
          value={dateValue}
          onChange={onCalendarChange}
          minValue={minValue}
          maxValue={maxValue}
          isDisabled={isBusy}
        >
          <DateField.Group variant="secondary" className="w-auto">
            <DateField.InputContainer>
              <DateField.Input>
                {(segment) => <DateField.Segment segment={segment} />}
              </DateField.Input>
            </DateField.InputContainer>
            <DateField.Suffix>
              <DatePicker.Trigger>
                <DatePicker.TriggerIndicator />
              </DatePicker.Trigger>
            </DateField.Suffix>
          </DateField.Group>
          <DatePicker.Popover className="max-w-fit! w-fit">
            <Calendar>
              <Calendar.Header>
                <Calendar.NavButton slot="previous" />
                <Calendar.Heading className="text-center" />
                <Calendar.NavButton slot="next" />
              </Calendar.Header>
              <Calendar.Grid>
                <Calendar.GridHeader>
                  {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
                </Calendar.GridHeader>
                <Calendar.GridBody>
                  {(date) => <Calendar.Cell date={date} />}
                </Calendar.GridBody>
              </Calendar.Grid>
            </Calendar>
          </DatePicker.Popover>
        </DatePicker>
      ) : null}

      <Button
        variant="tertiary"
        size="sm"
        isIconOnly
        aria-label="Next day"
        isDisabled={isBusy || isToday}
        onPress={() => shiftDay(1)}
      >
        <ChevronRight className="size-4" />
      </Button>

      {!isToday && (
        <Button
          variant="tertiary"
          size="sm"
          onPress={() => onDayChange(todayIso)}
          isDisabled={isBusy}
        >
          Today
        </Button>
      )}
    </div>
  );
}

/** Non-interactive fallback for the demo path. */
function StaticDayLabel({ label }: { label: string }) {
  return (
    <div className="rounded-md border border-border bg-surface-secondary px-3 py-1.5 text-sm text-foreground">
      {label}
    </div>
  );
}

// ── Small pure helpers ───────────────────────────────────────────────────

/** `YYYY-MM-DD` + integer days, on UTC arithmetic (safe across DST). */
function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const t = Date.UTC(y, m - 1, d) + days * 86_400_000;
  const out = new Date(t);
  const yy = out.getUTCFullYear().toString().padStart(4, "0");
  const mm = (out.getUTCMonth() + 1).toString().padStart(2, "0");
  const dd = out.getUTCDate().toString().padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function safeParseDate(iso: string): CalendarDate | null {
  try {
    return parseDate(iso);
  } catch {
    return null;
  }
}
