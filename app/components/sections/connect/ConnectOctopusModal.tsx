"use client";

import type { ReactNode } from "react";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Button, Chip, Modal, useOverlayState } from "@heroui/react";
import { ArrowUpRightFromSquare, ThunderboltFill } from "@gravity-ui/icons";
import { TextInputField } from "@/app/components/ui/TextInputField";
import { PasswordField } from "@/app/components/ui/PasswordField";
import { connectOctopus } from "@/app/lib/connect-actions";
import type { ConnectResult } from "@/app/lib/connect-actions";

/**
 * Octopus credential dialog.
 *
 * Uses the same `useActionState` + uncontrolled form pattern as
 * {@link ConnectSunSyncModal} — the API key never lives in React state,
 * which keeps it out of dev-tools trees and client-side logs. Success
 * flips the whole `/energyflow-home` page to its connected tier via
 * revalidation inside the Server Action.
 */

const OCTOPUS_API_KEY_URL =
  "https://octopus.energy/dashboard/new/accounts/personal-details/api-access";

const INITIAL: ConnectResult | null = null;
const FORM_ID = "connect-octopus";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      variant="primary"
      type="submit"
      isDisabled={pending}
      form={FORM_ID}
    >
      {pending ? "Connecting…" : "Connect Octopus"}
    </Button>
  );
}

export function ConnectOctopusModal({
  children,
  successHref,
}: {
  children: ReactNode;
  /** See ConnectSunSyncModal.successHref — same shape, same rationale. */
  successHref?: string;
}) {
  const [result, formAction] = useActionState(
    async (_prev: ConnectResult | null, form: FormData) => connectOctopus(form),
    INITIAL,
  );
  const overlay = useOverlayState();
  const router = useRouter();

  const succeeded = result?.ok === true;

  // See ConnectSunSyncModal — destructure `close` so the effect deps stay
  // stable and don't re-fire router.push on every render.
  const { close } = overlay;
  useEffect(() => {
    if (!succeeded) return;
    close();
    if (successHref) router.push(successHref);
  }, [succeeded, successHref, close, router]);

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
                <div className="flex flex-wrap items-center gap-2">
                  <Modal.Heading>Connect Octopus</Modal.Heading>
                  {result?.ok && (
                    <Chip color="success" variant="soft" size="sm">
                      Connected
                    </Chip>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted">
                  Paste your Octopus API key and account number. We read your
                  tariff, consumption and export credits — never write.
                </p>
              </div>
            </Modal.Header>

            <Modal.Body>
              <form id={FORM_ID} action={formAction} className="flex flex-col gap-5">
                {result && !result.ok && (
                  <div
                    role="alert"
                    className="rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-danger"
                  >
                    {result.error}
                  </div>
                )}
                <div hidden={succeeded} className="flex flex-col gap-5">
                  <TextInputField
                    name="accountNumber"
                    label="Octopus account number"
                    autoComplete="off"
                    placeholder="A-1234ABCD"
                    isRequired
                    autoFocus
                    description="Top of your Octopus dashboard, under your name. Starts with an A."
                  />
                  {/* PasswordField reused for the API key so we get the same
                      masking + show/hide toggle — the key is a long-lived
                      secret and deserves the same "never visible in the
                      round-trip" affordance a password gets. */}
                  <PasswordField
                    name="apiKey"
                    label="Octopus API key"
                    autoComplete="off"
                    isRequired
                    description="Starts with sk_live_. Generated in Octopus → Personal details → API access."
                  />
                  <a
                    href={OCTOPUS_API_KEY_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-foreground underline underline-offset-4"
                  >
                    Open Octopus API access page
                    <ArrowUpRightFromSquare className="size-3" />
                  </a>
                  <p className="text-xs text-muted">
                    We&rsquo;ll start a one-time back-fill of the last ~13
                    months of consumption so charts and stats have history
                    to show from day one.
                  </p>
                </div>
                {succeeded && (
                  <div className="rounded-lg border border-success/30 bg-success/10 p-4 text-sm text-success">
                    Octopus linked. {successHref ? "Taking you to the dashboard…" : "You can close this window."}
                  </div>
                )}
              </form>
            </Modal.Body>

            <Modal.Footer>
              <Modal.CloseTrigger />
              {!succeeded && <SubmitButton />}
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
