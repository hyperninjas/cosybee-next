"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Calendar,
  Card,
  DateField,
  DatePicker,
  Input,
  TextArea,
} from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { slugify, slugifyInput } from "@/app/lib/slug";
import { checkSlug, type SlugCheck } from "@/app/(private)/admin/actions";
import { Labeled } from "./Labeled";

/** How long to wait after the last keystroke before asking the server. */
const CHECK_DEBOUNCE_MS = 400;

/**
 * "Post details" card — excerpt, slug, byline date, lede.
 *
 * The slug is entered by hand (or generated from the title in one click) and
 * checked for availability as it is typed. It used to shadow the title until
 * someone edited it, which meant a post nobody had thought about got whatever
 * URL the headline happened to say at the moment of saving.
 *
 * The byline date is a HeroUI DatePicker speaking the plain `YYYY-MM-DD`
 * wire format.
 */
export function PostDetailsCard({
  blog,
  slug,
  postId,
  title,
  slugError,
  description,
  setDescription,
  setSlug,
  authorDate,
  setAuthorDate,
  lede,
  setLede,
}: {
  blog: string;
  slug: string;
  /** Id of the post being edited — it must not conflict with itself. */
  postId?: string;
  /** Current title, for "Generate from title". */
  title: string;
  slugError?: string;
  description: string;
  setDescription: (v: string) => void;
  setSlug: (v: string) => void;
  authorDate: string;
  setAuthorDate: (v: string) => void;
  lede: string;
  setLede: (v: string) => void;
}) {
  // The last answer we got, tagged with the slug it was about.
  const [checked, setChecked] = useState<{
    slug: string;
    result: SlugCheck;
  } | null>(null);

  // Ask the server whether the slug is free, once the typing settles.
  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const result = await checkSlug(blog, slug, postId);
      if (!cancelled) setChecked({ slug, result });
    }, CHECK_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [blog, slug, postId]);

  // Only trust an answer that is about the slug currently in the box. Storing
  // the slug alongside the result — rather than clearing state on every
  // keystroke — means a slow reply for an old slug can never be shown against
  // a new one, and there is no setState in the effect body to race with it.
  const check: SlugCheck =
    checked && checked.slug === slug ? checked.result : { state: "idle" };

  const generated = slugify(title);
  const canGenerate = Boolean(generated) && generated !== slug;

  // A server-side save error outranks the inline hint: it is newer, and it is
  // the reason the save actually failed.
  const message = slugError
    ? { tone: "error" as const, text: slugError }
    : check.state === "taken" || check.state === "invalid"
      ? { tone: "error" as const, text: check.message }
      : check.state === "available"
        ? { tone: "ok" as const, text: "Available" }
        : check.state === "error"
          ? { tone: "warn" as const, text: check.message }
          : null;
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
          hint="The article's URL. Required, and must be unique."
        >
          <div className="flex items-start gap-2">
            <Input
              variant="secondary"
              fullWidth
              className="font-mono"
              value={slug}
              placeholder="my-article"
              // `slugifyInput`, not `slugify`, while typing: the strict version
              // strips trailing hyphens, so a dash vanished the instant it was
              // typed and could not be entered at all.
              onChange={(e) => setSlug(slugifyInput(e.target.value))}
              // Settle to the canonical form once focus leaves, so a hyphen
              // left dangling at the end doesn't reach the URL.
              onBlur={() => setSlug(slugify(slug))}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="shrink-0"
              isDisabled={!canGenerate}
              onPress={() => setSlug(generated)}
            >
              Generate
            </Button>
          </div>
          <span className="mt-1 block font-mono text-xs text-muted">
            /{blog}/{slug || "…"}
          </span>
          {message && (
            <span
              className={`mt-1 block text-xs font-medium ${
                message.tone === "error"
                  ? "text-danger"
                  : message.tone === "ok"
                    ? "text-success"
                    : "text-warning"
              }`}
            >
              {message.text}
            </span>
          )}
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
