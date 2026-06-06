"use client";

import { useState } from "react";
import { normalizeTag } from "@/app/lib/slug";

const MAX_TAGS = 8;
const MAX_SUGGESTIONS = 8;

/**
 * Chip-style tag editor with autocomplete against existing tags.
 * Type and press Enter (or comma) to add, click a suggestion to add,
 * Backspace on an empty field removes the last tag.
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
  const [focused, setFocused] = useState(false);

  function add(raw: string) {
    const tag = normalizeTag(raw);
    const exists = tags.some((t) => t.toLowerCase() === tag.toLowerCase());
    if (tag && !exists && tags.length < MAX_TAGS) setTags([...tags, tag]);
    setDraft("");
  }

  function removeAt(i: number) {
    setTags(tags.filter((_, j) => j !== i));
  }

  const q = draft.trim().toLowerCase();
  const matches = suggestions
    .filter((s) => !tags.some((t) => t.toLowerCase() === s.toLowerCase()))
    .filter((s) => (q ? s.toLowerCase().includes(q) : true))
    .slice(0, MAX_SUGGESTIONS);
  const showDropdown = focused && tags.length < MAX_TAGS && matches.length > 0;

  return (
    <div className="relative">
      <input type="hidden" name={name} value={JSON.stringify(tags)} />
      <div className="flex flex-wrap items-center gap-2">
        {tags.map((t, i) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-md bg-background px-2 py-1 text-sm font-medium text-muted"
          >
            #{t}
            <button
              type="button"
              onClick={() => removeAt(i)}
              aria-label={`Remove ${t}`}
              className="leading-none text-muted hover:text-accent"
            >
              ×
            </button>
          </span>
        ))}
        {tags.length < MAX_TAGS && (
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              // Delay so a suggestion click registers before hiding.
              setTimeout(() => setFocused(false), 120);
              if (draft) add(draft);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                add(matches.length === 1 ? matches[0] : draft);
              } else if (e.key === "Backspace" && !draft && tags.length) {
                removeAt(tags.length - 1);
              }
            }}
            placeholder={tags.length ? "Add another tag…" : "Add up to 8 tags…"}
            className="min-w-40 flex-1 bg-transparent py-1 text-sm focus:outline-none"
          />
        )}
      </div>

      {showDropdown && (
        <ul className="absolute z-10 mt-1 max-h-56 w-full max-w-xs overflow-auto rounded-lg border border-border bg-surface py-1 shadow-lg">
          {matches.map((s) => (
            <li key={s}>
              <button
                type="button"
                // onMouseDown beats the input's blur so the click lands.
                onMouseDown={(e) => {
                  e.preventDefault();
                  add(s);
                }}
                className="flex w-full items-center px-3 py-1.5 text-left text-sm hover:bg-[#F4F8FA]"
              >
                <span className="text-muted">#</span>
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
