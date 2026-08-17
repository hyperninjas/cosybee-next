"use client";

import { useRouter } from "next/navigation";
import type { LinkTarget } from "@/app/lib/link-targets";
import type { AdminPhrase } from "../lib/api";
import { FormModal } from "../taxonomy/FormModal";
import PhraseForm from "./PhraseForm";

/** Modal shell around PhraseForm — mirrors TagFormModal. */
export function PhraseFormModal({
  isOpen,
  onOpenChange,
  phrase,
  linkTargets,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  phrase?: AdminPhrase;
  linkTargets: LinkTarget[];
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
      title={phrase ? "Edit phrase" : "New phrase"}
      description="Shown in the site footer, one entry per week."
    >
      {/* Keyed on the row being edited so the form's internal state is rebuilt
          per phrase — without it, opening a second row after a first would
          show the first one's text. */}
      <PhraseForm
        key={phrase?.id ?? "new"}
        phrase={phrase}
        linkTargets={linkTargets}
        onSaved={handleSaved}
        onCancel={() => onOpenChange(false)}
      />
    </FormModal>
  );
}
