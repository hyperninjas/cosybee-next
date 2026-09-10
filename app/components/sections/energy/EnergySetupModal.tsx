"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Modal, useOverlayState } from "@heroui/react";
import { ThunderboltFill } from "@gravity-ui/icons";

import { EnergySetupFlow } from "./EnergySetupFlow";
import type { EnergyProvider } from "@/app/lib/energy-actions";

/**
 * The dashboard's way into the supplier → tariff → bill flow.
 *
 * Someone can reach the dashboard with no tariff — they skipped the step, or
 * their account predates it. Before this, the only thing offered there was
 * "Connect Octopus", which is the same dead end the onboarding step was
 * built to remove: useless to the twenty other suppliers' customers.
 *
 * It runs the identical flow rather than a trimmed-down version. Two paths
 * to the same three questions is how the answers end up differing by which
 * door you came through.
 *
 * On success the dialog closes and the page re-renders, so the card the user
 * just came from is replaced by their actual tariff — the change is visible
 * where they were looking.
 */
export function EnergySetupModal({
  providers,
  postcode,
  children,
}: {
  providers: EnergyProvider[];
  postcode: string;
  /** The trigger — usually the card's CTA button. */
  children: ReactNode;
}) {
  const overlay = useOverlayState();
  const router = useRouter();

  return (
    <Modal state={overlay}>
      <Modal.Trigger>{children}</Modal.Trigger>
      <Modal.Backdrop>
        <Modal.Container size="lg" placement="center">
          <Modal.Dialog>
            <Modal.Header className="flex-row items-start gap-3">
              <Modal.Icon className="bg-[color:var(--efh-grid)]/10 text-[color:var(--efh-grid)]">
                <ThunderboltFill className="size-5" />
              </Modal.Icon>
              <div className="flex-1">
                <Modal.Heading>Your energy supplier</Modal.Heading>
                <p className="text-xs text-muted">
                  We use your tariff to work out what your energy costs.
                </p>
              </div>
            </Modal.Header>

            <Modal.Body>
              {/* Keyed on open state so a dialog closed halfway through
                  reopens at the first question rather than resuming a
                  half-answered run. */}
              <EnergySetupFlow
                key={overlay.isOpen ? "open" : "closed"}
                providers={providers}
                postcode={postcode}
                onDone={() => {
                  overlay.close();
                  router.refresh();
                }}
              />
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
