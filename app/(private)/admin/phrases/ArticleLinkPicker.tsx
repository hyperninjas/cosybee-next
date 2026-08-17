"use client";

import type { Key } from "react";
import {
  Autocomplete,
  EmptyState,
  Header,
  ListBox,
  SearchField,
  useFilter,
} from "@heroui/react";
import { groupLabel, type LinkTarget } from "@/app/lib/link-targets";

/** Section order in the dropdown — pages first, then the two blogs. */
const GROUPS = ["Pages", "The Hive", "Learn"] as const;

/**
 * Picks the page a phrase links to, from the site's own published pages and
 * articles (the same catalogue the post editor's link picker uses).
 *
 * A free-text URL field would have been half the code and the wrong control:
 * this link renders in the footer of EVERY page, so a mistyped slug is a
 * sitewide 404, and `getLinkTargets()` already knows exactly which paths are
 * live. Choosing from that list makes the broken state unreachable rather than
 * merely discouraged.
 *
 * When the saved path is no longer in the catalogue — the article was
 * unpublished or renamed after the phrase was written — it is added back as a
 * flagged entry instead of silently reading as "nothing selected". Losing the
 * link on the next unrelated save is exactly the failure this component exists
 * to prevent, and the warning tells the admin what to fix.
 */
export function ArticleLinkPicker({
  targets,
  value,
  label,
  onChange,
}: {
  targets: LinkTarget[];
  /** Currently selected site-relative path, or "" when unset. */
  value: string;
  /** Title stored alongside the path (admin display only). */
  label: string | null;
  onChange: (path: string, label: string | null) => void;
}) {
  const { contains } = useFilter({ sensitivity: "base" });

  const known = targets.some((t) => t.path === value);
  const stale: LinkTarget[] =
    value && !known
      ? [{ kind: "page", title: label ?? value, path: value }]
      : [];
  const all = [...stale, ...targets];
  const selected = all.find((t) => t.path === value);

  // The stale entry is listed, not merely displayed: a selected key that isn't
  // in the collection is one React Aria is entitled to drop, which would clear
  // the link on mount — the opposite of preserving it.
  const sections = [
    ...(stale.length > 0
      ? [{ group: "Currently linked (not published)", items: stale }]
      : []),
    ...GROUPS.map((group) => ({
      group: group as string,
      items: targets.filter((t) => groupLabel(t) === group),
    })),
  ].filter((section) => section.items.length > 0);

  return (
    <div>
      <Autocomplete
        aria-label="Linked page"
        selectionMode="single"
        variant="secondary"
        fullWidth
        placeholder="Search pages and articles…"
        value={value || null}
        onChange={(key: Key | Key[] | null) => {
          const path = typeof key === "string" ? key : "";
          const target = all.find((t) => t.path === path);
          onChange(path, target?.title ?? null);
        }}
      >
        <Autocomplete.Trigger>
          <Autocomplete.Value>
            {selected ? (
              <span className="flex min-w-0 flex-col items-start text-left">
                <span className="truncate text-sm font-medium text-foreground">
                  {selected.title}
                </span>
                <span className="truncate font-mono text-xs text-muted">
                  {selected.path}
                </span>
              </span>
            ) : (
              <span className="text-sm text-muted">
                Search pages and articles…
              </span>
            )}
          </Autocomplete.Value>
          <Autocomplete.Indicator />
        </Autocomplete.Trigger>
        <Autocomplete.Popover className="max-h-96">
          <Autocomplete.Filter filter={contains}>
            <SearchField autoFocus name="search" variant="secondary">
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Search by title or slug…" />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
            <ListBox
              renderEmptyState={() => (
                <EmptyState>No pages match that search</EmptyState>
              )}
            >
              {sections.map((section) => (
                <ListBox.Section key={section.group}>
                  <Header>{section.group}</Header>
                  {section.items.map((target) => (
                    <ListBox.Item
                      key={target.path}
                      id={target.path}
                      // Both title and slug are searchable: an admin who knows
                      // the URL types "heat-pump", one who knows the piece
                      // types its headline.
                      textValue={`${target.title} ${target.path}`}
                    >
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-sm text-foreground">
                          {target.title}
                        </span>
                        <span className="truncate font-mono text-xs text-muted">
                          {target.path}
                        </span>
                      </span>
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox.Section>
              ))}
            </ListBox>
          </Autocomplete.Filter>
        </Autocomplete.Popover>
      </Autocomplete>

      {value && !known && (
        <p className="mt-1 text-xs font-medium text-warning">
          This page isn’t in the published list any more — it may have been
          unpublished or renamed. Pick a live page before saving.
        </p>
      )}
    </div>
  );
}
