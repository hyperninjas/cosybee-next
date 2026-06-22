"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Alert, AlertDialog, Button, Input } from "@heroui/react";
import { TriangleExclamationFill } from "@gravity-ui/icons";
import type { TariffDTO } from "../lib/api";
import { deleteTariffAction } from "./actions";
import { initialSaveState } from "../lib/form-state";

/**
 * Type-to-confirm delete dialog for a tariff (a deliberately "heavy" gate for a
 * destructive, irreversible action). The Delete button stays disabled until the
 * admin types the tariff's exact name, and the body spells out everything that
 * goes with it (all its regional rates). On success it calls `onDeleted` so the
 * page can clear the selection.
 */
export function DeleteTariffDialog({
  isOpen,
  onOpenChange,
  tariff,
  onDeleted,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tariff: TariffDTO | null;
  onDeleted: () => void;
}) {
  const [state, formAction] = useActionState(
    deleteTariffAction,
    initialSaveState,
  );
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    if (state?.ok) onDeleted();
  }, [state, onDeleted]);

  // Clear the typed confirmation on close (covers Cancel / backdrop / Esc); the
  // parent also keys this dialog per-tariff so it's fresh for each one.
  const handleOpenChange = (open: boolean) => {
    if (!open) setConfirmText("");
    onOpenChange(open);
  };

  const matches = tariff != null && confirmText.trim() === tariff.name;
  const regionCount = tariff?.regions.length ?? 0;

  return (
    <AlertDialog isOpen={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialog.Backdrop>
        <AlertDialog.Container>
          <AlertDialog.Dialog>
            <AlertDialog.Header>
              <AlertDialog.Heading className="flex items-center gap-2 text-danger">
                <TriangleExclamationFill className="size-5 shrink-0" />
                Delete tariff
              </AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body className="space-y-3">
              <p className="text-sm text-muted">
                This permanently deletes{" "}
                <span className="font-semibold text-foreground">
                  {tariff?.name}
                </span>{" "}
                ({tariff?.provider.name}) and its{" "}
                <span className="font-semibold text-foreground">
                  {regionCount}
                </span>{" "}
                regional rate{regionCount === 1 ? "" : "s"}. This can&apos;t be
                undone.
              </p>

              <div>
                <label
                  htmlFor="delete-confirm"
                  className="mb-1 block text-sm text-foreground"
                >
                  Type <span className="font-semibold">{tariff?.name}</span> to
                  confirm
                </label>
                <Input
                  id="delete-confirm"
                  variant="secondary"
                  fullWidth
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={tariff?.name ?? ""}
                  autoComplete="off"
                />
              </div>

              {state?.error && (
                <Alert status="danger">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Description>{state.error}</Alert.Description>
                  </Alert.Content>
                </Alert>
              )}
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button
                variant="tertiary"
                onPress={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <form action={formAction}>
                <input type="hidden" name="id" value={tariff?.id ?? ""} />
                <DeleteButton enabled={matches} />
              </form>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}

function DeleteButton({ enabled }: { enabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="danger"
      isDisabled={!enabled || pending}
      isPending={pending}
    >
      Delete tariff
    </Button>
  );
}
