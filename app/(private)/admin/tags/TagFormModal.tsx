"use client";

import { useRouter } from "next/navigation";
import type { Tag } from "@/app/lib/article-types";
import { FormModal } from "../taxonomy/FormModal";
import TagForm from "./TagForm";

/**
 * Modal shell around TagForm. Reusable from any admin surface.
 */
export function TagFormModal({
  isOpen,
  onOpenChange,
  tag,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tag?: Tag;
}) {
  const router = useRouter();

  const handleSaved = () => {
    onOpenChange(false);
    router.refresh();
  };

  return (
    <FormModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={tag ? "Edit tag" : "New tag"}
    >
      <TagForm
        tag={tag}
        onSaved={handleSaved}
        onCancel={() => onOpenChange(false)}
      />
    </FormModal>
  );
}
