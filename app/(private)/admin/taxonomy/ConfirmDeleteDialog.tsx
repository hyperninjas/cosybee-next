"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Alert,
  AlertDialog,
  Button,
} from "@heroui/react";
import { initialSaveState, type SaveState } from "../lib/form-state";

/**
 * Reusable destructive-action confirmation dialog. Wraps a server action
 * that returns SaveState — the dialog handles the "are you sure?" gate,
 * pending state on the submit button, error display, and self-close +
 * router.refresh() on success.
 *
 * Generic so any admin surface (authors / categories / tags / posts /
 * future entities) can reuse it for delete-with-confirm flows.
 *
 *   <ConfirmDeleteDialog
 *     isOpen={overlay.isOpen}
 *     onOpenChange={overlay.setOpen}
 *     title="Delete Jane Doe?"
 *     description="This will permanently remove the author."
 *     action={deleteAuthorAction}
 *     entityId={deleting?.id}
 *   />
 */
export function ConfirmDeleteDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  action,
  entityId,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  /** Server action returning SaveState. Receives `id` from the hidden input. */
  action: (state: SaveState, formData: FormData) => Promise<SaveState>;
  /** Entity id to send to the action. */
  entityId?: string;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(action, initialSaveState);

  // Close the dialog once the action confirms success; the list is then
  // refreshed so the deleted row disappears.
  useEffect(() => {
    if (state?.ok) {
      onOpenChange(false);
      router.refresh();
    }
  }, [state, onOpenChange, router]);

  return (
    <AlertDialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <AlertDialog.Backdrop>
        <AlertDialog.Container>
          <AlertDialog.Dialog>
            <AlertDialog.Header>
              <AlertDialog.Heading>{title}</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body className="space-y-3">
              <p className="text-sm text-muted">{description}</p>
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
                onPress={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <form action={formAction}>
                <input type="hidden" name="id" value={entityId ?? ""} />
                <DeleteButton label={confirmLabel} />
              </form>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}

function DeleteButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="danger"
      isDisabled={pending}
      isPending={pending}
    >
      {label}
    </Button>
  );
}
