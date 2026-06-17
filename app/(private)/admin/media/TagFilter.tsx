"use client";

import { Button, Dropdown, Label } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import type { MediaTagCount } from "@/app/lib/storage";

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/**
 * Multi-select tag filter built on HeroUI's Dropdown menu in `multiple`
 * selection mode — selecting toggles a tag and keeps the menu open (with a
 * checkmark indicator), unlike a single-action menu. OR semantics: the caller
 * filters to media carrying any selected tag.
 */
export function TagFilter({
  tags,
  selected,
  onChange,
}: {
  tags: MediaTagCount[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const count = selected.size;

  return (
    <div className="flex items-center gap-1">
      <Dropdown>
        <Dropdown.Trigger
          className={`${buttonVariants({ variant: "tertiary", size: "md" })} flex rounded-2xl gap-1.5`}
        >
          Tags
          {count > 0 && (
            <span className="flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-white">
              {count}
            </span>
          )}
          <ChevronIcon className="size-3.5 text-muted" />
        </Dropdown.Trigger>
        <Dropdown.Popover className="min-w-56">
          {tags.length === 0 ? (
            <Dropdown.Menu aria-label="Filter by tags" disabledKeys={["none"]}>
              <Dropdown.Item id="none" textValue="No tags">
                <Label className="text-muted">No tags yet.</Label>
              </Dropdown.Item>
            </Dropdown.Menu>
          ) : (
            <Dropdown.Menu
              aria-label="Filter by tags"
              selectionMode="multiple"
              selectedKeys={selected}
              onSelectionChange={(keys) =>
                onChange(
                  keys === "all"
                    ? new Set(tags.map((t) => t.id))
                    : new Set(Array.from(keys, String)),
                )
              }
            >
              {tags.map((t) => (
                <Dropdown.Item key={t.id} id={t.id} textValue={t.name}>
                  <Label>#{t.name}</Label>
                  <span className="ml-auto rounded-full bg-surface-secondary px-1.5 text-[10px] font-medium text-muted">
                    {t.count}
                  </span>
                  <Dropdown.ItemIndicator type="checkmark" />
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          )}
        </Dropdown.Popover>
      </Dropdown>

      {count > 0 && (
        <Button size="sm" variant="ghost" onPress={() => onChange(new Set())}>
          Clear
        </Button>
      )}
    </div>
  );
}
