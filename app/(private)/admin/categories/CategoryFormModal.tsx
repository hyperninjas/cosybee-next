"use client";

import { useRouter } from "next/navigation";
import type { Category } from "@/app/lib/article-types";
import { FormModal } from "../taxonomy/FormModal";
import CategoryForm from "./CategoryForm";

/**
 * Modal shell around CategoryForm. See AuthorFormModal for the pattern;
 * kept as a thin wrapper so other admin pages (e.g. the post editor's
 * category picker) can reuse it.
 */
export function CategoryFormModal({
  isOpen,
  onOpenChange,
  category,
  defaultBlog,
  onSaved,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category;
  defaultBlog?: "hive" | "learn";
  /** Notify the parent of the just-saved Category so it can auto-select
   *  it in the post editor's picker. The modal still closes + refreshes. */
  onSaved?: (saved?: Category) => void;
}) {
  const router = useRouter();

  const handleSaved = (saved?: Category) => {
    onSaved?.(saved);
    onOpenChange(false);
    router.refresh();
  };

  return (
    <FormModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={category ? "Edit category" : "New category"}
    >
      <CategoryForm
        category={category}
        defaultBlog={defaultBlog}
        onSaved={handleSaved}
        onCancel={() => onOpenChange(false)}
      />
    </FormModal>
  );
}
