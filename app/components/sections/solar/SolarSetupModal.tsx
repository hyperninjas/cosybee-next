"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Modal, useOverlayState } from "@heroui/react";
import { Sun } from "@gravity-ui/icons";

import { SolarSetupFlow } from "./SolarSetupFlow";
import type { SolarOptions } from "@/app/lib/solar-actions";

/**
 * The dashboard's way into the solar declaration flow.
 *
 * The mirror of `EnergySetupModal`: someone can reach the dashboard with no
 * system declared, and the only thing offered there used to be "Connect
 * Sunsynk" — the same dead end for the other eleven brands.
 *
 * Runs the identical flow rather than a shortened one, and closes on save so
 * the page re-renders with what they just described.
 */
export function SolarSetupModal({
  options,
  children,
}: {
  options: SolarOptions;
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
            {/* `--efh-solar` is scoped to `.efh-scope` in globals.css and
                doesn't resolve here (dialog portals to `document.body`),
                so the previous tile rendered as a colourless square with
                the sun floating on the surface behind it. Semantic
                warning-soft tokens give it a real filled tile. Bottom
                border makes the header a distinct band from the body,
                which used to run into the first phase's question with no
                visual break. */}
            <Modal.Header className="flex-row items-center gap-3 border-b border-separator pb-5">
              <Modal.Icon className="size-12 bg-warning-soft text-warning-soft-foreground">
                <Sun className="size-7" />
              </Modal.Icon>
              <div className="flex-1">
                <Modal.Heading className="text-xl leading-tight">
                  Your solar setup
                </Modal.Heading>
                <p className="mt-0.5 text-sm leading-5 text-muted">
                  Tell us what you have and we&apos;ll estimate what it
                  generates.
                </p>
              </div>
            </Modal.Header>

            <Modal.Body>
              {/* Keyed on open state so a dialog closed halfway reopens at
                  the first question rather than resuming a partial answer. */}
              <SolarSetupFlow
                key={overlay.isOpen ? "open" : "closed"}
                options={options}
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
