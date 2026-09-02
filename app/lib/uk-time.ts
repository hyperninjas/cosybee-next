/**
 * UK wall-clock helpers, without a timezone database.
 *
 * Every property in this product is in the UK — the SunSync backend reports
 * `timezone: "Europe/London"` and the mobile app pins every day window on the
 * same clock (see `energiebeemobile/lib/features/phase1/domain/models/uk_time.dart`).
 * Aligning here means the web's "today" and the mobile's "today" mean the
 * same 24-hour slice of readings.
 *
 * ### Why the rule, not an IANA lookup
 *
 * British Summer Time is defined by statute: it starts on the **last Sunday
 * in March at 01:00 UTC** and ends on the **last Sunday in October at 01:00
 * UTC**. That's a dozen lines and needs no tzdata bundle. If this product
 * ever ships outside the UK, replace this file with the real database rather
 * than extending the rule.
 */

/** UTC instant of the last Sunday of `month` in `year`, at 01:00 UTC. */
function lastSundayAt01Utc(year: number, month: number): Date {
  // Day 0 of the next month === last day of this one.
  const lastDay = new Date(Date.UTC(year, month, 0));
  // Date.getUTCDay: Sunday = 0 … Saturday = 6.
  const lastSunday = lastDay.getUTCDate() - lastDay.getUTCDay();
  return new Date(Date.UTC(year, month - 1, lastSunday, 1, 0, 0));
}

/** Whether `utc` falls inside British Summer Time. */
export function isBritishSummerTime(utc: Date): boolean {
  const start = lastSundayAt01Utc(utc.getUTCFullYear(), 3);
  const end = lastSundayAt01Utc(utc.getUTCFullYear(), 10);
  // Half-open: the 01:00 UTC boundary itself is already BST in spring, and
  // already GMT in autumn.
  return utc.getTime() >= start.getTime() && utc.getTime() < end.getTime();
}

/** The UK offset for `utc` — one hour in summer, zero in winter. */
export function ukOffsetMs(utc: Date): number {
  return isBritishSummerTime(utc) ? 60 * 60_000 : 0;
}

/**
 * `utc` expressed as UK wall-clock time.
 *
 * The returned Date is a UTC-flagged Date whose UTC fields carry UK clock
 * values — what day-bucketing and label formatting need. It is deliberately
 * NOT a "real" local time; converting to the server's zone is exactly the
 * bug this avoids (the Node server may be UTC while the customer is BST).
 */
export function toUkWallClock(utc: Date): Date {
  return new Date(utc.getTime() + ukOffsetMs(utc));
}

/** The UTC instant at which the UK calendar day containing `utc` began. */
export function ukDayStartUtc(utc: Date): Date {
  const wall = toUkWallClock(utc);
  const midnightWall = Date.UTC(
    wall.getUTCFullYear(),
    wall.getUTCMonth(),
    wall.getUTCDate(),
  );
  // Subtract the offset that applies at midnight, not at `utc` — on a DST
  // changeover day those differ by one hour.
  return new Date(midnightWall - ukOffsetMs(new Date(midnightWall)));
}

/**
 * `YYYY-MM-DD` for the UK day containing `utc`. Matches the mobile's
 * `ukDateParam` and the format the backend accepts.
 */
export function ukDateParam(utc: Date): string {
  const wall = toUkWallClock(utc);
  const y = wall.getUTCFullYear().toString().padStart(4, "0");
  const m = (wall.getUTCMonth() + 1).toString().padStart(2, "0");
  const d = wall.getUTCDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** "HH:MM" UK wall clock for the instant `utc`. */
export function ukHhMm(utc: Date): string {
  const wall = toUkWallClock(utc);
  const h = wall.getUTCHours().toString().padStart(2, "0");
  const m = wall.getUTCMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Parse a `YYYY-MM-DD` UK date into the UTC instant at which that UK day
 * began. Throws on malformed input — callers should treat that as a 400.
 */
export function parseUkDateParam(iso: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) throw new Error(`invalid UK date: ${iso}`);
  const [, y, m, d] = match;
  const midnightWall = Date.UTC(Number(y), Number(m) - 1, Number(d));
  return new Date(midnightWall - ukOffsetMs(new Date(midnightWall)));
}
