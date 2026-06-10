"use client";

import { useState } from "react";
import { Button, useOverlayState } from "@heroui/react";
import type { Category } from "@/app/lib/article-types";
import { deleteCategoryAction } from "../taxonomy/actions";
import { ConfirmDeleteDialog } from "../taxonomy/ConfirmDeleteDialog";
import { CategoryFormModal } from "./CategoryFormModal";

export function CategoriesList({ categories }: { categories: Category[] }) {
  const overlay = useOverlayState();
  const deleteOverlay = useOverlayState();
  const [editing, setEditing] = useState<Category | undefined>(undefined);
  const [deleting, setDeleting] = useState<Category | undefined>(undefined);

  const openCreate = () => {
    setEditing(undefined);
    overlay.open();
  };
  const openEdit = (c: Category) => {
    setEditing(c);
    overlay.open();
  };
  const openDelete = (c: Category) => {
    setDeleting(c);
    deleteOverlay.open();
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Categories</h1>
          <p className="mt-1 text-sm text-muted">{categories.length} total</p>
        </div>
        <Button variant="primary" onPress={openCreate}>
          + New category
        </Button>
      </div>

      {categories.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
          No categories yet. Create one to get started.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {categories.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-4 p-4 transition-colors hover:bg-background"
            >
              {c.color && (
                <span
                  aria-hidden
                  className="inline-block size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-foreground">
                  {c.name}
                </div>
                <div className="truncate text-xs text-muted">
                  {c.blog} · /{c.slug}
                </div>
              </div>
              <button
                type="button"
                onClick={() => openEdit(c)}
                className="text-sm font-medium text-accent transition-colors hover:underline"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => openDelete(c)}
                className="text-sm font-medium text-danger transition-colors hover:underline"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      <CategoryFormModal
        isOpen={overlay.isOpen}
        onOpenChange={overlay.setOpen}
        category={editing}
      />

      <ConfirmDeleteDialog
        isOpen={deleteOverlay.isOpen}
        onOpenChange={deleteOverlay.setOpen}
        title={`Delete ${deleting?.name ?? "category"}?`}
        description="This permanently removes the category. Posts currently in it will need to be reassigned first."
        action={deleteCategoryAction}
        entityId={deleting?.id}
      />
    </>
  );
}
