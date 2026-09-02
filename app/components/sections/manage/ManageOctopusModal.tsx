"use client";

import type { ReactNode } from "react";
import { useState, useTransition } from "react";
import { Button, Chip, Modal } from "@heroui/react";
import { ThunderboltFill } from "@gravity-ui/icons";
import { disconnectOctopus } from "@/app/lib/provider-actions";

/**
 * Post-connect management dialog for Octopus. Octopus has no "switch
 * account within the same login" concept the way SunSync does — a single
 * Octopus API key maps to one Octopus account — so this dialog offers
 * disconnect only. Kept as its own component so the ProviderStatusBar can
 * mount `<ManageOctopusModal>` identically to `<ManageSunSyncModal>`.
 */

interface Props {
  children: ReactNode;
  propertyLabel?: string | null;
  accountNumber?: string | null;
}

export function ManageOctopusModal({ children, propertyLabel, accountNumber }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setConfirming(false);
    setError(null);
  }

  function handleDisconnect() {
    setError(null);
    startTransition(async () => {
      const result = await disconnectOctopus();
      if (!result.ok) setError(result.error);
      else reset();
    });
  }

  return (
    <Modal>
      <Modal.Trigger>{children}</Modal.Trigger>
      <Modal.Backdrop>
        <Modal.Container size="lg" placement="center">
          <Modal.Dialog>
            <Modal.Header className="flex-row items-start gap-3">
              <Modal.Icon className="bg-[color:var(--efh-grid)]/10 text-[color:var(--efh-grid)]">
                <ThunderboltFill className="size-5" />
              </Modal.Icon>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Modal.Heading>Manage Octopus</Modal.Heading>
                  {propertyLabel && (
                    <Chip color="default" variant="soft" size="sm">
                      {propertyLabel}
                    </Chip>
                  )}
                  {accountNumber && (
                    <Chip color="default" variant="soft" size="sm">
                      Account {accountNumber}
                    </Chip>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted">
                  {confirming
                    ? "This unlinks your Octopus account from this home. Historical readings stay in your account."
                    : "Disconnect the Octopus link for this home."}
                </p>
              </div>
            </Modal.Header>

            <Modal.Body>
              {error && (
                <div
                  role="alert"
                  className="mb-4 rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-danger"
                >
                  {error}
                </div>
              )}
              {!confirming && (
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  className="flex w-full flex-col items-start gap-1 rounded-lg border border-danger/30 bg-danger/5 p-4 text-left transition hover:bg-danger/10"
                >
                  <span className="text-sm font-semibold text-danger">
                    Disconnect Octopus
                  </span>
                  <span className="text-xs text-muted">
                    Stop tariff and consumption sync. Historical readings kept.
                  </span>
                </button>
              )}
              {confirming && (
                <div className="rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
                  <p className="font-semibold">Disconnect this Octopus account?</p>
                  <p className="mt-1 text-danger/80">
                    Tariff and cost cards will fall back to their placeholder
                    values until you reconnect. Historical consumption readings
                    are preserved.
                  </p>
                </div>
              )}
            </Modal.Body>

            <Modal.Footer>
              {!confirming && <Modal.CloseTrigger />}
              {confirming && (
                <>
                  <Button variant="tertiary" onPress={reset} isDisabled={pending}>
                    Back
                  </Button>
                  <Button
                    variant="danger"
                    onPress={handleDisconnect}
                    isDisabled={pending}
                  >
                    {pending ? "Disconnecting…" : "Disconnect"}
                  </Button>
                </>
              )}
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
