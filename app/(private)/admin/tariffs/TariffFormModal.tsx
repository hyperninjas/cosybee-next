"use client";

import { FormModal } from "../taxonomy/FormModal";
import type { TariffDTO, TariffProviderDTO } from "../lib/api";
import { TariffForm } from "./TariffForm";

/**
 * Modal shell around TariffForm for creating a new tariff. Closes + forwards
 * the saved tariff once the create action returns `{ ok: true }`.
 */
export function TariffFormModal({
  isOpen,
  onOpenChange,
  providers,
  onCreated,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  providers: TariffProviderDTO[];
  onCreated: (created?: TariffDTO) => void;
}) {
  return (
    <FormModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="New tariff"
      description="Create the tariff, then add its regional rates in the table."
    >
      <TariffForm
        providers={providers}
        onSaved={onCreated}
        onCancel={() => onOpenChange(false)}
      />
    </FormModal>
  );
}
