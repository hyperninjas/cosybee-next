"use client";

import { useState } from "react";
import { Button, useOverlayState } from "@heroui/react";
import type { Tag } from "@/app/lib/article-types";
import { deleteTagAction } from "../taxonomy/actions";
import { ConfirmDeleteDialog } from "../taxonomy/ConfirmDeleteDialog";
import { TagFormModal } from "./TagFormModal";

export function TagsList({ tags }: { tags: Tag[] }) {
  const overlay = useOverlayState();
  const deleteOverlay = useOverlayState();
  const [editing, setEditing] = useState<Tag | undefined>(undefined);
  const [deleting, setDeleting] = useState<Tag | undefined>(undefined);

  const openCreate = () => {
    setEditing(undefined);
    overlay.open();
  };
  const openEdit = (t: Tag) => {
    setEditing(t);
    overlay.open();
  };
  const openDelete = (t: Tag) => {
    setDeleting(t);
    deleteOverlay.open();
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Tags</h1>
          <p className="mt-1 text-sm text-muted">{tags.length} total</p>
        </div>
        <Button variant="primary" onPress={openCreate}>
          + New tag
        </Button>
      </div>

      {tags.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
          No tags yet. Create one to get started.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {tags.map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-4 p-4 transition-colors hover:bg-background"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-foreground">
                  #{t.name}
                </div>
                <div className="truncate text-xs text-muted">
                  /tag/{t.slug}
                  {t.description ? ` · ${t.description}` : ""}
                </div>
              </div>
              <button
                type="button"
                onClick={() => openEdit(t)}
                className="text-sm font-medium text-accent transition-colors hover:underline"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => openDelete(t)}
                className="text-sm font-medium text-danger transition-colors hover:underline"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      <TagFormModal
        isOpen={overlay.isOpen}
        onOpenChange={overlay.setOpen}
        tag={editing}
      />

      <ConfirmDeleteDialog
        isOpen={deleteOverlay.isOpen}
        onOpenChange={deleteOverlay.setOpen}
        title={`Delete #${deleting?.name ?? "tag"}?`}
        description="This removes the tag from every post it's attached to. The action cannot be undone."
        action={deleteTagAction}
        entityId={deleting?.id}
      />
    </>
  );
}
