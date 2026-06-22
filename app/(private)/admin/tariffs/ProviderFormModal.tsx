"use client";

import { FormModal } from "../taxonomy/FormModal";
import type { TariffProviderDTO } from "../lib/api";
import { ProviderForm } from "./ProviderForm";

/**
 * Modal shell around ProviderForm for editing a provider. Forwards the saved
 * provider so the page can patch the selected tariff's provider in place.
 */
export function ProviderFormModal({
  isOpen,
  onOpenChange,
  provider,
  onSaved,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  provider: TariffProviderDTO | null;
  onSaved: (saved?: TariffProviderDTO) => void;
}) {
  return (
    <FormModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Edit provider"
      description={provider ? provider.name : undefined}
    >
      {provider && (
        <ProviderForm
          provider={provider}
          onSaved={onSaved}
          onCancel={() => onOpenChange(false)}
        />
      )}
    </FormModal>
  );
}
