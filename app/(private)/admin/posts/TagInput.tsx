"use client";

import { useRef, useState } from "react";
import { ComboBox, Input, ListBox, ListBoxItem } from "@heroui/react";
import { Plus, Xmark } from "@gravity-ui/icons";
import { normalizeTag } from "@/app/lib/slug";

const MAX_TAGS = 8;
const MAX_SUGGESTIONS = 8;

type Item = {
  id: string;
  label: string;
  kind: "create" | "suggest";
};

/**
 * Chip-style tag editor backed by HeroUI's ComboBox primitive so the popover,
 * keyboard navigation, and focus styling match the rest of the post editor.
 *
 * The dropdown always shows an explicit "Add <draft> as new" row at the top
 * when the typed value would become a brand-new tag — this disambiguates
 * the "I want a new tag whose name is a prefix of an existing one" case
 * that an `Enter`-commits-existing-on-single-match shortcut gets wrong.
 *
 * Hidden input emits the same `JSON.stringify(tags)` payload the existing
 * `parseTags(formData)` server action expects.
 */
export default function TagInput({
  name,
  initial,
  suggestions = [],
}: {
  name: string;
  initial: string[];
  suggestions?: string[];
}) {
  const [tags, setTags] = useState<string[]>(initial);
  const [draft, setDraft] = useState("");
  // Set when ComboBox's onSelectionChange fires during this Enter so the
  // sibling onKeyDown handler can avoid double-adding the typed text on
  // top of the selected item.
  const justSelectedAt = useRef(0);

  const atMax = tags.length >= MAX_TAGS;

  function add(raw: string) {
    const tag = normalizeTag(raw);
    if (!tag) return;
    const exists = tags.some((t) => t.toLowerCase() === tag.toLowerCase());
    if (exists || tags.length >= MAX_TAGS) return;
    setTags([...tags, tag]);
    setDraft("");
  }

  function removeAt(i: number) {
    setTags(tags.filter((_, j) => j !== i));
  }

  // Build the dropdown items: matching suggestions filtered against the
  // already-added tags, optionally preceded by a synthetic "Add <draft> as
  // new" row when the draft would be a fresh tag.
  const q = draft.trim();
  const qLower = q.toLowerCase();
  const matching = suggestions
    .filter((s) => !tags.some((t) => t.toLowerCase() === s.toLowerCase()))
    .filter((s) => (qLower ? s.toLowerCase().includes(qLower) : true))
    .slice(0, MAX_SUGGESTIONS);

  const normalized = q ? normalizeTag(q) : "";
  const isExactSuggestion = matching.some((s) => s.toLowerCase() === qLower);
  const alreadyTagged = tags.some(
    (t) => t.toLowerCase() === normalized.toLowerCase(),
  );
  const showCreate = !!normalized && !isExactSuggestion && !alreadyTagged;

  const items: Item[] = [
    ...(showCreate
      ? [
          {
            id: `create:${normalized}`,
            label: normalized,
            kind: "create" as const,
          },
        ]
      : []),
    ...matching.map<Item>((s) => ({
      id: `suggest:${s}`,
      label: s,
      kind: "suggest" as const,
    })),
  ];

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={JSON.stringify(tags)} />

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((t, i) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-md bg-background px-2 py-1 text-sm font-medium text-foreground"
            >
              #{t}
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label={`Remove ${t}`}
                className="rounded p-0.5 text-muted transition-colors hover:bg-surface hover:text-foreground"
              >
                <Xmark className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <ComboBox
        aria-label="Add tag"
        items={items}
        allowsCustomValue
        menuTrigger="input"
        inputValue={draft}
        onInputChange={setDraft}
        isDisabled={atMax}
        onSelectionChange={(key) => {
          if (key == null) return;
          const found = items.find((it) => it.id === String(key));
          if (!found) return;
          justSelectedAt.current = Date.now();
          add(found.label);
        }}
      >
        <ComboBox.InputGroup>
          {/* Designer wants the input visually plain — strip the
              border/background/shadow that HeroUI's `.input` and ComboBox's
              `[data-slot="input"]` focus state otherwise add. `!` (Tailwind
              v4 important) defeats the base selectors. */}
          <Input
            variant="secondary"
            fullWidth
            placeholder={
              atMax
                ? `Maximum ${MAX_TAGS} tags`
                : tags.length
                  ? "Add another tag…"
                  : `Add up to ${MAX_TAGS} tags…`
            }
            className="border-0! bg-transparent! shadow-none! outline-none! ring-0! px-0! focus:border-transparent! focus:bg-transparent! focus:outline-none! focus:shadow-none! focus:ring-0!"
            onKeyDown={(e) => {
              // Backspace on empty input → drop the last chip.
              if (e.key === "Backspace" && !draft && tags.length > 0) {
                removeAt(tags.length - 1);
                return;
              }
              // Enter commits the typed value as a new tag. If ComboBox just
              // fired onSelectionChange for this same Enter (user navigated
              // to an item with arrow keys), skip — `add()` already ran.
              if (e.key === "Enter" && draft.trim()) {
                if (Date.now() - justSelectedAt.current < 50) return;
                e.preventDefault();
                add(draft);
              }
            }}
          />
        </ComboBox.InputGroup>
        <ComboBox.Popover>
          <ListBox>
            {(item: Item) => (
              <ListBoxItem id={item.id} textValue={item.label}>
                {item.kind === "create" ? (
                  <span className="flex items-center gap-2 text-sm">
                    <Plus className="size-4 text-accent" />
                    Add{" "}
                    <span className="font-medium text-foreground">
                      &ldquo;{item.label}&rdquo;
                    </span>{" "}
                    as new
                  </span>
                ) : (
                  <span className="text-sm">
                    <span className="text-muted">#</span>
                    {item.label}
                  </span>
                )}
              </ListBoxItem>
            )}
          </ListBox>
        </ComboBox.Popover>
      </ComboBox>

      <span className="block text-xs text-muted">
        {tags.length}/{MAX_TAGS} tags{atMax && " — limit reached"}
      </span>
    </div>
  );
}
