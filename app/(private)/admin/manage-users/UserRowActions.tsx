"use client";

import { useState } from "react";
import { Button, Modal } from "@heroui/react";
import type { User } from "./types";

/**
 * Per-row ban / unban control. Unban is a low-risk toggle (single press with a
 * spinner); ban is destructive, so it opens a confirmation modal first. Both
 * keep local pending state so only the affected row shows a busy state.
 */
export function UserRowActions({
  user,
  onBan,
  onUnban,
}: {
  user: User;
  onBan: (userId: string) => Promise<void>;
  onUnban: (userId: string) => Promise<void>;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function run(action: () => Promise<void>) {
    setPending(true);
    try {
      await action();
      setConfirmOpen(false);
    } catch {
      // Parent surfaces the failure as a toast.
    } finally {
      setPending(false);
    }
  }

  if (user.banned) {
    return (
      <Button
        size="sm"
        variant="secondary"
        isPending={pending}
        onPress={() => run(() => onUnban(user.id))}
      >
        Unban
      </Button>
    );
  }

  return (
    <>
      <Button size="sm" variant="danger-soft" onPress={() => setConfirmOpen(true)}>
        Ban
      </Button>

      <Modal.Backdrop
        variant="blur"
        isOpen={confirmOpen}
        onOpenChange={setConfirmOpen}
      >
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Ban {user.name}?</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p className="text-sm text-muted">
                {user.name} ({user.email}) will be signed out and blocked from
                signing in until you unban them. You can reverse this at any
                time.
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="tertiary" isDisabled={pending}>
                Cancel
              </Button>
              <Button
                variant="danger"
                isPending={pending}
                onPress={() => run(() => onBan(user.id))}
              >
                Ban user
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
