"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Alert, Button, Input, Switch, TextArea } from "@heroui/react";
import type { TariffProviderDTO } from "../lib/api";
import { updateProviderAction } from "./actions";
import { initialSaveState, type EntitySaveState } from "../lib/form-state";

function Labeled({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="mb-1 block text-sm font-semibold text-foreground">
        {label}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs font-medium text-danger">
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-muted">{hint}</span>
      ) : null}
    </div>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="primary"
      isDisabled={pending}
      isPending={pending}
    >
      Save provider
    </Button>
  );
}

/**
 * Edit-provider form. `acquiredBy` doubles as the active/acquired switch — set
 * it to mark the brand acquired (backend then flags it inactive), clear it to
 * keep it active.
 */
export function ProviderForm({
  provider,
  onSaved,
  onCancel,
}: {
  provider: TariffProviderDTO;
  onSaved?: (saved?: TariffProviderDTO) => void;
  onCancel?: () => void;
}) {
  const [state, formAction] = useActionState<
    EntitySaveState<TariffProviderDTO>,
    FormData
  >(updateProviderAction, initialSaveState);
  const errors = state?.fieldErrors ?? {};

  useEffect(() => {
    if (state?.ok) onSaved?.(state.entity);
  }, [state, onSaved]);

  const [name, setName] = useState(provider.name);
  const [acquiredBy, setAcquiredBy] = useState(provider.acquiredBy ?? "");
  const [note, setNote] = useState(provider.note ?? "");
  const [isPopular, setIsPopular] = useState(provider.isPopular);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={provider.id} />
      <input type="hidden" name="isPopular" value={isPopular ? "on" : ""} />

      {state?.error && (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{state.error}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      <Labeled label="Name" error={errors.name} hint={`/${provider.slug}`}>
        <Input
          variant="secondary"
          fullWidth
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Octopus Energy"
        />
      </Labeled>

      <Labeled
        label="Acquired by"
        hint="Leave blank if the provider is still active. Set the acquiring brand to mark it acquired (no new tariffs)."
      >
        <Input
          variant="secondary"
          fullWidth
          name="acquiredBy"
          value={acquiredBy}
          onChange={(e) => setAcquiredBy(e.target.value)}
          placeholder="e.g. Octopus Energy"
        />
      </Labeled>

      <Labeled label="Note">
        <TextArea
          variant="secondary"
          fullWidth
          name="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
        />
      </Labeled>

      <Switch
        isSelected={isPopular}
        onChange={setIsPopular}
        className="justify-between"
      >
        <Switch.Content>
          <span className="block text-sm font-semibold text-foreground">
            Popular provider
          </span>
          <span className="block text-xs text-muted">
            Surfaced first in provider lists.
          </span>
        </Switch.Content>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch>

      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            Cancel
          </button>
        )}
        <SaveButton />
      </div>
    </form>
  );
}
