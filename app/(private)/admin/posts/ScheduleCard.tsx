"use client";

import {
  Calendar,
  Card,
  DateField,
  DatePicker,
  TimeField,
} from "@heroui/react";
import { useSyncExternalStore } from "react";
import { parseDateTime, type CalendarDateTime } from "@internationalized/date";
import { Labeled } from "./Labeled";

/**
 * "Now", read once and then frozen.
 *
 * Deciding whether the chosen time is still in the future needs the clock, and
 * the clock cannot be read during render: the server and the browser would
 * produce different text and hydration would mismatch. `useSyncExternalStore`
 * is the sanctioned way to read an outside value — the server snapshot is 0,
 * so the notice simply isn't rendered until hydration.
 *
 * The value is cached at module level so every read returns the same number.
 * A snapshot that changed on each call would re-render forever. Being a few
 * minutes stale is irrelevant to "publishes in about 6 hours".
 */
/** How often the countdown re-reads the clock. Fine for minutes-and-up
 *  phrasing, and cheap: one timer shared by every subscriber. */
const CLOCK_TICK_MS = 30_000;

let clockNow = 0;
const clockListeners = new Set<() => void>();
let clockTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Start ticking while anything is watching, and stop when nothing is.
 *
 * The first version of this returned a no-op and froze the timestamp, which
 * did prevent the render loop but also meant the countdown never moved: it
 * said "publishes in 2 minutes" indefinitely, and the notice stayed up long
 * after the post had gone live. A real subscription fixes both — React
 * re-renders on each tick, and once the time passes the notice removes itself.
 *
 * `"use no memo"` — React Compiler runs in `compilationMode: "all"` and would
 * otherwise inject a `useMemoCache` hook into these top-level functions, which
 * throws when React calls them outside a render.
 */
const subscribeToClock = (onStoreChange: () => void) => {
  "use no memo";
  clockListeners.add(onStoreChange);
  clockTimer ??= setInterval(() => {
    clockNow = Date.now();
    for (const listener of clockListeners) listener();
  }, CLOCK_TICK_MS);
  return () => {
    clockListeners.delete(onStoreChange);
    if (clockListeners.size === 0 && clockTimer) {
      clearInterval(clockTimer);
      clockTimer = null;
    }
  };
};

/**
 * The snapshot must be STABLE between ticks. Returning `Date.now()` on every
 * call would hand React a new value each render and loop forever, which is why
 * the timestamp is cached and only the interval above moves it.
 */
const readClock = () => {
  "use no memo";
  if (!clockNow) clockNow = Date.now();
  return clockNow;
};

/** 0 on the server, so the notice simply isn't rendered until hydration. */
const readClockOnServer = () => {
  "use no memo";
  return 0;
};

/**
 * Schedule card — set a future `publishedAt` to delay publication. Only
 * meaningful when the eventual save status is PUBLISHED; the backend
 * gates public visibility on `publishedAt <= now`.
 *
 * The picker emits the same `"YYYY-MM-DDTHH:mm"` wire format that the
 * native `<input type="datetime-local">` did, so the surrounding form
 * state, hidden input, and server action are untouched.
 */
export function ScheduleCard({
  publishedAt,
  setPublishedAt,
  status,
}: {
  publishedAt: string;
  setPublishedAt: (v: string) => void;
  /** Current save status — a future time only bites a PUBLISHED post. */
  status: string;
}) {
  // Parse the stored wire-format string into a CalendarDateTime so both
  // the DatePicker and the in-popover TimeField can share the same value.
  const value: CalendarDateTime | null = (() => {
    if (!publishedAt) return null;
    try {
      // parseDateTime accepts "YYYY-MM-DDTHH:mm" and the seconds-padded form.
      return parseDateTime(publishedAt);
    } catch {
      return null;
    }
  })();

  // CalendarDateTime.toString() emits seconds; trim to 16 chars to keep
  // the existing "YYYY-MM-DDTHH:mm" wire format intact.
  const writeValue = (v: CalendarDateTime | null) => {
    setPublishedAt(v ? v.toString().slice(0, 16) : "");
  };

  /**
   * How far in the future the chosen time is, in plain words — or null when it
   * is in the past (i.e. live immediately).
   *
   * This exists because a future time is INVISIBLE otherwise: the post saves
   * as PUBLISHED, the admin lists it as published, and it simply is not on the
   * site. Worth stating out loud, because the field arrives pre-filled when
   * you reopen a published post — so a time you never chose can be sitting in
   * it.
   */
  const now = useSyncExternalStore(
    subscribeToClock,
    readClock,
    readClockOnServer,
  );
  const goesLive = (() => {
    if (!publishedAt || !now) return null;
    const when = new Date(publishedAt);
    if (isNaN(when.getTime())) return null;
    const ms = when.getTime() - now;
    if (ms <= 0) return null;

    // Largest unit that fits, so a two-day wait reads "in 2 days" rather than
    // "in 48 hours". `numeric: "auto"` also turns the awkward cases into
    // English — one day out becomes "tomorrow", not "in 1 day".
    const relativeFormat = new Intl.RelativeTimeFormat("en-GB", {
      numeric: "auto",
    });
    const minutes = Math.round(ms / 60_000);
    const relative =
      minutes < 1
        ? "in under a minute"
        : minutes < 60
          ? relativeFormat.format(minutes, "minute")
          : ms < 86_400_000
            ? relativeFormat.format(Math.round(ms / 3_600_000), "hour")
            : relativeFormat.format(Math.round(ms / 86_400_000), "day");

    // The exact moment matters more than the countdown — "in 14 hours" is
    // hard to act on, "Sat 16 Aug, 09:00" is something you can check against a
    // calendar. Rendered on the author's own clock, which is the clock they
    // will compare it to.
    const exact = when.toLocaleString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

    return { relative, exact };
  })();

  return (
    <Card>
      <Card.Header>
        <Card.Title className="text-sm font-semibold">Schedule</Card.Title>
      </Card.Header>
      <Card.Content className="space-y-3">
        <Labeled
          label="Publish at"
          hint="Leave blank to publish immediately when you save. Future times = the post goes live automatically."
        >
          <DatePicker
            aria-label="Publish at"
            granularity="minute"
            value={value}
            onChange={writeValue}
            className="w-full"
          >
            <DateField.Group fullWidth variant="secondary">
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
            {/* HeroUI caps `.date-picker__popover` at `max-w-(--trigger-width)`
                — fine for full-width inputs but our trigger is an icon
                button. Lift the cap and let the calendar's intrinsic
                grid drive the popover width. */}
            <DatePicker.Popover className="max-w-fit! w-fit">
              <div className="flex flex-col gap-3">
                <Calendar>
                  <Calendar.Header>
                    <Calendar.NavButton slot="previous" />
                    <Calendar.Heading className="text-center" />
                    <Calendar.NavButton slot="next" />
                  </Calendar.Header>
                  <Calendar.Grid>
                    <Calendar.GridHeader>
                      {(day) => (
                        <Calendar.HeaderCell>{day}</Calendar.HeaderCell>
                      )}
                    </Calendar.GridHeader>
                    <Calendar.GridBody>
                      {(date) => <Calendar.Cell date={date} />}
                    </Calendar.GridBody>
                  </Calendar.Grid>
                </Calendar>
                {/* Time picker shares the parent's CalendarDateTime so
                    edits to hours/minutes here also write back to
                    `publishedAt`. Disabled until a date is chosen — a
                    bare Time can't round-trip to the wire format. */}
                <div className="border-t border-border pt-3">
                  <TimeField
                    aria-label="Time"
                    value={value}
                    onChange={writeValue}
                    isDisabled={!value}
                    hourCycle={12}
                  >
                    <TimeField.Group fullWidth variant="secondary">
                      <TimeField.InputContainer>
                        <TimeField.Input className={"justify-center"}>
                          {(segment) => <TimeField.Segment segment={segment} />}
                        </TimeField.Input>
                      </TimeField.InputContainer>
                    </TimeField.Group>
                  </TimeField>
                </div>
              </div>
            </DatePicker.Popover>
          </DatePicker>

          {/* A future time on a PUBLISHED post means the article is not on the
              site yet — which is otherwise silent: it saves fine and the admin
              lists it as published. Say so plainly, and offer the one-click
              way out, because this field pre-fills itself when you reopen a
              published post. */}
          {goesLive && (
            <div className="mt-2 rounded-md bg-warning/10 px-2.5 py-2 text-xs text-warning-foreground">
              {status === "PUBLISHED" ? (
                <>
                  <strong>Not live yet.</strong> Publishes{" "}
                  {goesLive.relative} — {goesLive.exact} — and stays hidden
                  until then.{" "}
                  <button
                    type="button"
                    className="font-semibold underline underline-offset-2"
                    onClick={() => setPublishedAt("")}
                  >
                    Publish immediately
                  </button>
                </>
              ) : (
                <>
                  Scheduled for {goesLive.exact} ({goesLive.relative}). Takes
                  effect once you publish.
                </>
              )}
            </div>
          )}
        </Labeled>
      </Card.Content>
    </Card>
  );
}
