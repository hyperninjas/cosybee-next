"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { startTransition, useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Modal, Spinner, useOverlayState } from "@heroui/react";
import {
  ArrowUpRightFromSquare,
  CircleCheckFill,
  Person,
} from "@gravity-ui/icons";
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
 * flips the whole `/dashboard` page to its connected tier via
 * revalidation inside the Server Action.
 *
 * ### Design notes
 *
 *   • Sibling of ConnectSunSyncModal and deliberately identical in
 *     shape: same header anatomy, same reassurance block, same footer
 *     pair, same loading and success cards.
 *   • Header icon tile uses HeroUI semantic tokens (`bg-accent-soft` /
 *     `text-accent-soft-foreground`) — an earlier version referenced
 *     `var(--efh-grid)`, which is scoped to `.efh-scope` in globals.css
 *     and resolves to nothing here because the dialog portals to
 *     `document.body`, outside that scope.
 *   • The "where do I find this" link rides on the API-key label rather
 *     than sitting on its own line under the fields.
 *   • No `autoFocus` on the account-number field: the theme's accent
 *     focus ring on an empty required field on modal-open reads as an
 *     error state ("orange border, red asterisk"). React Aria's dialog
 *     focus scope still parks focus somewhere reasonable inside the
 *     dialog.
 *   • The read-only promise is an `Alert` with a real border and
 *     soft-tinted background so it can't be mistaken for a disabled
 *     input, which is what happened when it was a bare `bg-secondary`
 *     div matching the field surfaces above it.
 */

const OCTOPUS_API_KEY_URL =
  "https://octopus.energy/dashboard/new/accounts/personal-details/api-access";

const INITIAL: ConnectResult | null = null;
const FORM_ID = "connect-octopus";

/**
 * Octopus's connect endpoint kicks off a ~13-month consumption back-fill
 * after auth, which the API doesn't await, but the connect POST itself
 * still takes a few seconds (auth + tariff / MPAN resolution). Cycling
 * status keeps the customer oriented while that runs.
 */
const SYNC_MESSAGES = [
  "Signing in to Octopus…",
  "Reading your account…",
  "Setting up the connection…",
  "Still working — this can take a moment…",
];

function SyncingCard() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (step >= SYNC_MESSAGES.length - 1) return;
    const t = setTimeout(() => setStep((s) => s + 1), 2000);
    return () => clearTimeout(t);
  }, [step]);
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-surface-secondary px-6 py-10 text-center"
    >
      <Spinner size="lg" />
      <div className="flex flex-col gap-1">
        <p className="text-base font-medium text-foreground">
          Talking to Octopus
        </p>
        <p aria-live="polite" className="text-sm text-muted">
          {SYNC_MESSAGES[step]}
        </p>
      </div>
    </div>
  );
}

function SuccessCard({ navigating }: { navigating: boolean }) {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-success-soft px-6 py-10 text-center"
    >
      <CircleCheckFill aria-hidden className="size-8 text-success" />
      <div className="flex flex-col gap-1">
        <p className="text-base font-medium text-foreground">Octopus linked</p>
        <p className="text-sm text-muted">
          {navigating ? "Taking you to the dashboard…" : "You can close this."}
        </p>
      </div>
    </div>
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
  const [result, formAction, isPending] = useActionState(
    async (_prev: ConnectResult | null, form: FormData) => connectOctopus(form),
    INITIAL,
  );
  const overlay = useOverlayState();
  const router = useRouter();

  const succeeded = result?.ok === true;
  const error = result && !result.ok ? result.error : null;

  // See ConnectSunSyncModal — destructure `close` so the effect deps stay
  // stable and don't re-fire router.push on every render. The beat before
  // closing lets the success card actually register.
  const { close } = overlay;
  useEffect(() => {
    if (!succeeded) return;
    const t = setTimeout(() => {
      close();
      if (successHref) router.push(successHref);
    }, 900);
    return () => clearTimeout(t);
  }, [succeeded, successHref, close, router]);

  const showFields = !succeeded && !isPending;

  return (
    <Modal state={overlay}>
      <Modal.Trigger>{children}</Modal.Trigger>
      {/* Outside-click dismissal is off mid-request so a stray click can't
          bin a pasted key. Cancel stays live as the deliberate way out. */}
      <Modal.Backdrop variant="blur" isDismissable={!isPending}>
        <Modal.Container size="md" placement="center">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            {/* onSubmit + manual dispatch instead of `action={formAction}`
                for consistency with ConnectSunSyncModal (see the block
                there for the React-19 auto-reset explanation). The
                `startTransition` wrapper is required for a manually
                dispatched `useActionState` action — without it `isPending`
                never flips and React logs a warning. */}
            <form
              id={FORM_ID}
              className="flex flex-col gap-5"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                startTransition(() => {
                  formAction(fd);
                });
              }}
            >
              {/* `pe-10` keeps the copy clear of the close button.
                  Header icon is the Octopus Energy brand mark (shared with
                  the mobile app under lib/assets/brand/suppliers) rather
                  than the generic bolt — instant recognition for anyone
                  who's already used the mobile app. */}
              <Modal.Header className="flex-row items-center gap-3 pe-10">
                <Image
                  src="/brand/octopus-energy.png"
                  alt=""
                  width={48}
                  height={48}
                  className="size-12 shrink-0 rounded-2xl"
                  priority
                />
                <div className="flex flex-1 flex-col gap-1">
                  <Modal.Heading>Connect Octopus</Modal.Heading>
                  <p className="text-sm leading-5 text-muted">
                    Paste your account number and API key.
                  </p>
                </div>
              </Modal.Header>

              <Modal.Body className="flex flex-col gap-5">
                {isPending && <SyncingCard />}
                {succeeded && <SuccessCard navigating={Boolean(successHref)} />}

                {showFields && error && (
                  <Alert status="danger">
                    <Alert.Indicator />
                    <Alert.Content>
                      <Alert.Title>Couldn&apos;t connect</Alert.Title>
                      <Alert.Description>{error}</Alert.Description>
                    </Alert.Content>
                  </Alert>
                )}

                {/* Hidden rather than unmounted while pending / succeeded so
                    the typed values survive a failed round-trip. */}
                <div hidden={!showFields} className="flex flex-col gap-4">
                  <TextInputField
                    name="accountNumber"
                    label="Account number"
                    placeholder="A-1234ABCD"
                    autoComplete="off"
                    icon={<Person aria-hidden className="size-4 text-muted" />}
                    isRequired={showFields}
                    description="Top of your Octopus dashboard."
                  />

                  {/* PasswordField reused for the API key so we get the same
                      masking + show/hide toggle — the key is a long-lived
                      secret and deserves the same "never visible in the
                      round-trip" affordance a password gets. The "find it"
                      link rides on the label instead of taking its own row. */}
                  <PasswordField
                    name="apiKey"
                    label="API key"
                    placeholder="sk_live_…"
                    autoComplete="off"
                    isRequired={showFields}
                    labelAction={
                      <a
                        href={OCTOPUS_API_KEY_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-foreground underline underline-offset-4"
                      >
                        Get your key
                        <ArrowUpRightFromSquare
                          aria-hidden
                          className="size-3"
                        />
                      </a>
                    }
                  />

                  {/* Soft success-tinted panel with a real border — reads
                      as an info panel rather than a disabled input. The
                      body copy stays neutral foreground (not green) so the
                      colour is a signal, not the payload. */}
                  <Alert
                    status="success"
                    className="rounded-2xl border border-success/25 bg-success-soft/40 px-4 py-3"
                  >
                    <Alert.Indicator className="text-success" />
                    <Alert.Content>
                      <Alert.Title className="text-sm font-semibold text-foreground">
                        Read-only — we never write to your Octopus account
                      </Alert.Title>
                      <Alert.Description className="text-xs leading-5 text-muted">
                        We&apos;ll back-fill about 13 months of consumption so
                        your charts have history from day one.
                      </Alert.Description>
                    </Alert.Content>
                  </Alert>
                </div>
              </Modal.Body>

              <Modal.Footer>
                {!succeeded && (
                  <>
                    <Button slot="close" variant="tertiary">
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      type="submit"
                      isDisabled={isPending}
                    >
                      {isPending ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          Connecting…
                        </>
                      ) : (
                        "Connect Octopus"
                      )}
                    </Button>
                  </>
                )}
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
