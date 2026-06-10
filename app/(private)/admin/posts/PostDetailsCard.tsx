"use client";

import {
  Calendar,
  Card,
  DateField,
  DatePicker,
  Input,
  TextArea,
} from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { slugify } from "@/app/lib/slug";
import { Labeled } from "./Labeled";

/**
 * "Post details" card — excerpt, slug, byline date, lede. Slug auto-derives
 * from the title until the admin edits it (slugTouched). The byline date
 * is a HeroUI DatePicker speaking the plain `YYYY-MM-DD` wire format.
 */
export function PostDetailsCard({
  blog,
  effectiveSlug,
  slugError,
  description,
  setDescription,
  setSlug,
  setSlugTouched,
  authorDate,
  setAuthorDate,
  lede,
  setLede,
}: {
  blog: string;
  effectiveSlug: string;
  slugError?: string;
  description: string;
  setDescription: (v: string) => void;
  setSlug: (v: string) => void;
  setSlugTouched: (v: boolean) => void;
  authorDate: string;
  setAuthorDate: (v: string) => void;
  lede: string;
  setLede: (v: string) => void;
}) {
  return (
    <Card>
      <Card.Header>
        <Card.Title className="text-sm font-semibold">Post details</Card.Title>
      </Card.Header>
      <Card.Content className="space-y-3">
        <Labeled
          label="Excerpt"
          hint="Card blurb + meta description. Auto from the body if blank."
        >
          <TextArea
            variant="secondary"
            fullWidth
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </Labeled>

        <Labeled
          label="Slug"
          error={slugError}
          hint="Auto from the title. Edit to override."
        >
          <Input
            variant="secondary"
            fullWidth
            className="font-mono"
            value={effectiveSlug}
            onChange={(e) => {
              setSlug(slugify(e.target.value));
              setSlugTouched(true);
            }}
          />
          <span className="mt-1 block text-xs text-muted">
            /{blog}/{effectiveSlug || "…"}
          </span>
        </Labeled>

        {/* Author date — segmented input + pop-out calendar. Wire format
            stays "YYYY-MM-DD" via parseDate ↔ toString(). */}
        <Labeled label="Author date" hint="Defaults to today.">
          <DatePicker
            aria-label="Author date"
            value={
              authorDate
                ? (() => {
                    try {
                      return parseDate(authorDate);
                    } catch {
                      return null;
                    }
                  })()
                : null
            }
            onChange={(v) => setAuthorDate(v ? v.toString() : "")}
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
            {/* HeroUI caps the popover at `max-w-(--trigger-width)` — fine
                for full-width inputs but our trigger is an icon button.
                Lift the cap and let the calendar's intrinsic grid drive
                the popover width. */}
            <DatePicker.Popover className="!max-w-fit w-fit">
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
        </Labeled>

        <Labeled label="Lede" hint="Bold subtitle under the title.">
          <Input
            variant="secondary"
            fullWidth
            value={lede}
            onChange={(e) => setLede(e.target.value)}
          />
        </Labeled>
      </Card.Content>
    </Card>
  );
}
