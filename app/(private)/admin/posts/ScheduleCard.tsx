"use client";

import {
  Calendar,
  Card,
  DateField,
  DatePicker,
  TimeField,
} from "@heroui/react";
import { parseDateTime, type CalendarDateTime } from "@internationalized/date";
import { Labeled } from "./Labeled";

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
}: {
  publishedAt: string;
  setPublishedAt: (v: string) => void;
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
        </Labeled>
      </Card.Content>
    </Card>
  );
}
