"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Switch, useOverlayState } from "@heroui/react";
import type { LinkTarget } from "@/app/lib/link-targets";
import type { AdminPhrase } from "../lib/api";
import { ConfirmDeleteDialog } from "../taxonomy/ConfirmDeleteDialog";
import {
  deletePhraseAction,
  reorderPhrasesAction,
  togglePhraseActiveAction,
} from "./actions";
import { PhraseFormModal } from "./PhraseFormModal";

/**
 * When this phrase's turn comes round.
 *
 * `"use no memo"` — the React Compiler runs in `compilationMode: "all"` and
 * injects a `useMemoCache` hook into top-level functions; this one is called
 * from a `.map` callback, where that would throw "Invalid hook call".
 */
function scheduleLabel(weeksAway: number): string {
  "use no memo";
  if (weeksAway === 0) return "Showing now";
  if (weeksAway === 1) return "Next week";
  return `In ${weeksAway} weeks`;
}

function DragHandleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="size-4 text-muted"
      aria-hidden
    >
      <circle cx="9" cy="6" r="1.6" />
      <circle cx="15" cy="6" r="1.6" />
      <circle cx="9" cy="12" r="1.6" />
      <circle cx="15" cy="12" r="1.6" />
      <circle cx="9" cy="18" r="1.6" />
      <circle cx="15" cy="18" r="1.6" />
    </svg>
  );
}

/**
 * The weekly rotation, as an ordered, editable list.
 *
 * Order IS the feature here, not a display preference: the footer walks this
 * list one entry per ISO week, so moving a row changes which quote the whole
 * site shows on a given week. Every reorder is therefore persisted immediately
 * rather than sitting behind a "Save order" button an admin could walk away
 * from believing the change had taken.
 *
 * Rows can be dragged, and every drag has a keyboard equivalent (the ↑/↓
 * buttons) — drag-and-drop alone would put the one thing this page exists to
 * do out of reach of keyboard and screen-reader users.
 */
export function PhrasesManager({
  phrases,
  linkTargets,
  isoWeek,
}: {
  phrases: AdminPhrase[];
  linkTargets: LinkTarget[];
  /** ISO week number of "today", computed on the server to keep SSR stable. */
  isoWeek: number;
}) {
  const router = useRouter();
  const overlay = useOverlayState();
  const deleteOverlay = useOverlayState();
  const [editing, setEditing] = useState<AdminPhrase | undefined>(undefined);
  const [deleting, setDeleting] = useState<AdminPhrase | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Local copy so a drag repaints immediately instead of waiting on the round
  // trip. Re-synced whenever the server hands down a new list (the documented
  // "adjust state during render" pattern — cheaper and less racy than an
  // effect, which would repaint the stale order first).
  const [rows, setRows] = useState(phrases);
  const [lastProps, setLastProps] = useState(phrases);
  if (lastProps !== phrases) {
    setLastProps(phrases);
    setRows(phrases);
  }

  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const active = rows.filter((p) => p.isActive);
  // Same formula the footer uses (lib/phrase-of-the-week.ts). Recomputed from
  // the live list so the schedule stays truthful while rows are being moved.
  const liveIndex = active.length > 0 ? (isoWeek - 1) % active.length : -1;

  /** Move a row and persist the whole new order. */
  const move = (from: number, to: number) => {
    if (to < 0 || to >= rows.length || from === to) return;
    const next = [...rows];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setRows(next);
    setError(null);

    const previous = rows;
    startTransition(async () => {
      const result = await reorderPhrasesAction(next.map((p) => p.id));
      if (!result.ok) {
        // Put the list back rather than leaving the screen showing an order
        // the site isn't actually using.
        setRows(previous);
        setError(result.error ?? "Could not save the new order.");
        return;
      }
      router.refresh();
    });
  };

  const toggleActive = (phrase: AdminPhrase, isActive: boolean) => {
    setRows((current) =>
      current.map((p) => (p.id === phrase.id ? { ...p, isActive } : p)),
    );
    setError(null);
    startTransition(async () => {
      const result = await togglePhraseActiveAction(phrase.id, isActive);
      if (!result.ok) {
        setRows((current) =>
          current.map((p) =>
            p.id === phrase.id ? { ...p, isActive: !isActive } : p,
          ),
        );
        setError(result.error ?? "Could not update the phrase.");
        return;
      }
      router.refresh();
    });
  };

  const openCreate = () => {
    setEditing(undefined);
    overlay.open();
  };
  const openEdit = (phrase: AdminPhrase) => {
    setEditing(phrase);
    overlay.open();
  };
  const openDelete = (phrase: AdminPhrase) => {
    setDeleting(phrase);
    deleteOverlay.open();
  };

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">Phrase of the Week</h1>
          <p className="mt-1 max-w-2xl whitespace-pre-line text-sm text-muted">
            {`The quote in the site footer. One entry runs per week, in the order below, then the list starts again. \n ${active.length} in rotation ${
              rows.length !== active.length
                ? ` · ${rows.length - active.length} paused`
                : ""
            } .`}
          </p>
        </div>
        <Button variant="primary" onPress={openCreate}>
          + New phrase
        </Button>
      </div>

      {error && (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      {rows.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
          No phrases yet. Until one exists the footer falls back to a built-in
          list — add one to take control of it.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {rows.map((phrase, index) => {
            const activeIndex = active.findIndex((p) => p.id === phrase.id);
            const weeksAway =
              activeIndex < 0 || liveIndex < 0
                ? null
                : (activeIndex - liveIndex + active.length) % active.length;
            const isLive = weeksAway === 0;

            return (
              <li
                key={phrase.id}
                draggable
                onDragStart={(e) => {
                  setDragIndex(index);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(e) => {
                  // Without preventDefault the browser refuses the drop.
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragIndex !== null) move(dragIndex, index);
                  setDragIndex(null);
                }}
                onDragEnd={() => setDragIndex(null)}
                className={`flex items-start gap-3 p-4 transition-colors hover:bg-background ${
                  dragIndex === index ? "opacity-50" : ""
                } ${isLive ? "bg-accent/5" : ""}`}
              >
                {/* Order controls */}
                <div className="flex shrink-0 flex-col items-center gap-1 pt-0.5">
                  <span className="cursor-grab active:cursor-grabbing">
                    <DragHandleIcon />
                  </span>
                  <span className="text-xs font-semibold tabular-nums text-muted">
                    {index + 1}
                  </span>
                  <button
                    type="button"
                    aria-label={`Move “${phrase.author}” up`}
                    onClick={() => move(index, index - 1)}
                    disabled={index === 0}
                    className="text-xs text-muted transition-colors hover:text-foreground disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    aria-label={`Move “${phrase.author}” down`}
                    onClick={() => move(index, index + 1)}
                    disabled={index === rows.length - 1}
                    className="text-xs text-muted transition-colors hover:text-foreground disabled:opacity-30"
                  >
                    ▼
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    {weeksAway === null ? (
                      <span className="rounded-full bg-border px-2 py-0.5 text-[11px] font-semibold text-muted">
                        Paused
                      </span>
                    ) : (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          isLive
                            ? "bg-accent text-white"
                            : "bg-border text-muted"
                        }`}
                      >
                        {scheduleLabel(weeksAway)}
                      </span>
                    )}
                  </div>
                  <blockquote className="line-clamp-2 text-sm italic text-foreground">
                    &ldquo;{phrase.quote}&rdquo;
                  </blockquote>
                  <div className="mt-1 truncate text-xs text-muted">
                    &mdash; {phrase.author} ·{" "}
                    <a
                      href={phrase.articlePath}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-accent hover:underline"
                    >
                      {phrase.articleLabel ?? phrase.articlePath}
                    </a>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <Switch
                    size="sm"
                    aria-label={`Keep “${phrase.author}” in the rotation`}
                    isSelected={phrase.isActive}
                    onChange={(v) => toggleActive(phrase, v)}
                  >
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                  </Switch>
                  <button
                    type="button"
                    onClick={() => openEdit(phrase)}
                    className="text-sm font-medium text-accent transition-colors hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => openDelete(phrase)}
                    className="text-sm font-medium text-danger transition-colors hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <PhraseFormModal
        isOpen={overlay.isOpen}
        onOpenChange={overlay.setOpen}
        phrase={editing}
        linkTargets={linkTargets}
      />

      <ConfirmDeleteDialog
        isOpen={deleteOverlay.isOpen}
        onOpenChange={deleteOverlay.setOpen}
        title="Delete this phrase?"
        description={
          deleting
            ? `“${deleting.quote.slice(0, 80)}${deleting.quote.length > 80 ? "…" : ""}” — ${deleting.author}. This cannot be undone; to take it out of the rotation temporarily, switch it off instead.`
            : "This cannot be undone."
        }
        action={deletePhraseAction}
        entityId={deleting?.id}
      />
    </>
  );
}
