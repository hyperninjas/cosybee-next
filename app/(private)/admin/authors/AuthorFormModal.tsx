"use client";

import { useRouter } from "next/navigation";
import type { Author } from "@/app/lib/article-types";
import { FormModal } from "../taxonomy/FormModal";
import AuthorForm from "./AuthorForm";

/**
 * Modal shell around AuthorForm. Reusable from any admin surface — pass in
 * an `author` to edit (omit to create). The modal closes itself once the
 * server action returns `{ ok: true }` and refreshes the route so the
 * caller's list re-renders.
 */
export function AuthorFormModal({
  isOpen,
  onOpenChange,
  author,
  onSaved,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  author?: Author;
  /** Notify the parent of the just-saved Author so it can react —
   *  e.g. auto-select the new author in the post editor. The modal
   *  always closes + refreshes regardless. */
  onSaved?: (saved?: Author) => void;
}) {
  const router = useRouter();

  const handleSaved = (saved?: Author) => {
    onSaved?.(saved);
    onOpenChange(false);
    router.refresh();
  };

  return (
    <FormModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={author ? "Edit author" : "New author"}
    >
      <AuthorForm
        author={author}
        onSaved={handleSaved}
        onCancel={() => onOpenChange(false)}
      />
    </FormModal>
  );
}
