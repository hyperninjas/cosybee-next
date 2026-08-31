"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Debounced typeahead against the AFD Postcode Evolution proxy. Same
 * shape as mobile's `AddressSearchField`: minimum 3 characters, 250 ms
 * debounce, session id grouping consecutive keystrokes into one billable
 * AFD lookup, keyboard nav on the suggestion list.
 *
 * The parent is told about a selection through `onPick(key, label)`. The
 * `key` is opaque — never parsed — and is what the next step (retrieve)
 * uses to resolve the full address.
 */

interface Suggestion {
  key: string;
  label: string;
  postcode: string;
  countryIso: string;
}

interface Props {
  onPick: (key: string, label: string) => void;
  autoFocus?: boolean;
}

const DEBOUNCE_MS = 250;
const MIN_CHARS = 3;

export function AddressSearch({ onPick, autoFocus }: Props) {
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(-1);
  // `sessionId` groups keystrokes into one billable AFD lookup. Rotate it
  // on every selection so the next fresh query starts a new session.
  const sessionIdRef = useRef<string>(newSessionId());

  const doSearch = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/onboarding/address/search?q=${encodeURIComponent(query)}&sessionId=${sessionIdRef.current}`,
        { cache: "no-store", credentials: "same-origin" },
      );
      if (!res.ok) {
        setError("Address search unavailable. Try again in a moment.");
        setSuggestions([]);
        return;
      }
      const body = (await res.json()) as { suggestions: Suggestion[] };
      setSuggestions(body.suggestions ?? []);
      setActive(-1);
    } catch {
      setError("Address search unavailable. Try again in a moment.");
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce. The below-min-chars case is derived from `q` at render time
  // (`showSuggestions` below) rather than reset in an effect — avoids the
  // cascading-render lint and one fewer state write per keystroke.
  useEffect(() => {
    if (q.trim().length < MIN_CHARS) return;
    const handle = setTimeout(() => {
      void doSearch(q.trim());
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [q, doSearch]);

  // Only surface suggestions / error / empty-state copy once the user has
  // typed enough. Below the min, everything is hidden — same UX, no
  // effect-driven state resets.
  const belowMin = q.trim().length < MIN_CHARS;
  const visibleSuggestions = belowMin ? [] : suggestions;
  const visibleError = belowMin ? null : error;

  function pick(s: Suggestion) {
    onPick(s.key, s.label);
    // Rotate session so a re-search after coming back doesn't accidentally
    // combine with the previous billable lookup.
    sessionIdRef.current = newSessionId();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      const s = suggestions[active];
      if (s) pick(s);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor="address-input" className="text-sm font-medium text-foreground">
        Address or postcode
      </label>
      <input
        id="address-input"
        type="text"
        autoComplete="off"
        autoFocus={autoFocus}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Start typing a postcode, e.g. SW1A 1AA"
        className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-base text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      {loading && !belowMin && <p className="text-xs text-muted">Searching…</p>}
      {visibleError && (
        <p role="alert" className="text-xs text-danger">
          {visibleError}
        </p>
      )}
      {visibleSuggestions.length > 0 && (
        <ul
          role="listbox"
          aria-label="Address suggestions"
          className="max-h-80 overflow-y-auto rounded-lg border border-border bg-surface shadow-sm"
        >
          {visibleSuggestions.map((s, i) => (
            <li key={s.key}>
              <button
                type="button"
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(s)}
                className={`flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left text-sm transition ${
                  i === active
                    ? "bg-primary/10 text-foreground"
                    : "text-foreground hover:bg-surface-secondary"
                }`}
              >
                <span className="font-medium">{s.label}</span>
                <span className="text-xs text-muted">{s.postcode}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {!belowMin && !loading && visibleSuggestions.length === 0 && !visibleError && (
        <p className="text-xs text-muted">
          No matches. Check the spelling, or try a nearby postcode.
        </p>
      )}
    </div>
  );
}

/**
 * `crypto.randomUUID` is available in every browser the app supports; the
 * `typeof` guard is only there so the file compiles under RSC / SSR where
 * the global would otherwise be evaluated at import time.
 */
function newSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
