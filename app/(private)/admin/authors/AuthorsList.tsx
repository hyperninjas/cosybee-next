"use client";

import { useEffect, useRef, useState } from "react";
import { Button, useOverlayState } from "@heroui/react";
import type { Author } from "@/app/lib/article-types";
import { AppAvatar } from "@/app/components/ui/AppAvatar";
import { deleteAuthorAction } from "../taxonomy/actions";
import { ConfirmDeleteDialog } from "../taxonomy/ConfirmDeleteDialog";
import { AuthorFormModal } from "./AuthorFormModal";

/**
 * Client wrapper that holds the modal state for create/edit and renders
 * the list rows. The server-rendered page just hands it the freshly
 * fetched authors and lets it take over interaction.
 */
export function AuthorsList({ authors }: { authors: Author[] }) {
  const overlay = useOverlayState();
  const deleteOverlay = useOverlayState();
  // Which author the modals are pointed at. `undefined` form-modal = create mode.
  const [editing, setEditing] = useState<Author | undefined>(undefined);
  const [deleting, setDeleting] = useState<Author | undefined>(undefined);

  const openCreate = () => {
    setEditing(undefined);
    overlay.open();
  };
  const openEdit = (a: Author) => {
    setEditing(a);
    overlay.open();
  };

  // Deep link: /admin/authors?edit={authorId} (e.g. the media library's
  // "used by author" link) auto-opens that author's edit modal once on mount.
  // Reads the URL directly (no useSearchParams → no Suspense requirement).
  const didAutoEdit = useRef(false);
  useEffect(() => {
    if (didAutoEdit.current) return;
    const editId = new URLSearchParams(window.location.search).get("edit");
    if (!editId) return;
    const author = authors.find((a) => a.id === editId);
    if (!author) return;
    didAutoEdit.current = true;
    // Defined inline (like useIsDesktop elsewhere) so this reads as a one-off
    // sync from the URL, not a cascading in-effect setState.
    const openForDeepLink = () => {
      setEditing(author);
      overlay.open();
    };
    openForDeepLink();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authors]);

  const openDelete = (a: Author) => {
    setDeleting(a);
    deleteOverlay.open();
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Authors</h1>
          <p className="mt-1 text-sm text-muted">{authors.length} total</p>
        </div>
        <Button variant="primary" onPress={openCreate}>
          + New author
        </Button>
      </div>

      {authors.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
          No authors yet. Create one to get started.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {authors.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-4 p-4 transition-colors hover:bg-background"
            >
              <AppAvatar
                src={a.avatarUrl}
                name={a.name}
                size="md"
                className="shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-foreground">
                  {a.name}
                </div>
                <div className="truncate text-xs text-muted">
                  {a.role ?? "—"} · /{a.slug}
                </div>
              </div>
              <button
                type="button"
                onClick={() => openEdit(a)}
                className="text-sm font-medium text-accent transition-colors hover:underline"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => openDelete(a)}
                className="text-sm font-medium text-danger transition-colors hover:underline"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      <AuthorFormModal
        isOpen={overlay.isOpen}
        onOpenChange={overlay.setOpen}
        author={editing}
      />

      <ConfirmDeleteDialog
        isOpen={deleteOverlay.isOpen}
        onOpenChange={deleteOverlay.setOpen}
        title={`Delete ${deleting?.name ?? "author"}?`}
        description="This permanently removes the author. Any posts authored by them will need to be reassigned first."
        action={deleteAuthorAction}
        entityId={deleting?.id}
      />
    </>
  );
}
