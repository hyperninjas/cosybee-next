"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button, Chip, Modal, Radio, RadioGroup } from "@heroui/react";
import { Sun } from "@gravity-ui/icons";
import { TextInputField } from "@/app/components/ui/TextInputField";
import { PasswordField } from "@/app/components/ui/PasswordField";
import { connectSunSync } from "@/app/lib/connect-actions";
import type { SunSyncConnectResult } from "@/app/lib/connect-actions";

/**
 * SunSync credential dialog with an inline plant / inverter picker.
 *
 * The flow can take 1, 2 or 3 submits depending on the shape of the
 * Sunsynk account:
 *
 *   1 submit  — one site, one inverter → straight through.
 *   2 submits — multiple sites → picker → second POST with `plantId`.
 *   3 submits — multiple sites AND the chosen one has multiple
 *               inverters → plant picker → inverter picker → final POST.
 *
 * The credential fields (email + password) stay mounted across every
 * step, so re-submitting after a picker re-uses whatever the user typed
 * originally — no need to hold credentials in React state or ferry them
 * through a hidden input.
 *
 * `useActionState` gives us the last Server Action result, which is a
 * discriminated union: `{ok:true}` closes the dialog, `{pickPlant}` /
 * `{pickInverter}` show a radio group, `{error}` shows the banner.
 */

const INITIAL: SunSyncConnectResult | null = null;

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      variant="primary"
      type="submit"
      isDisabled={pending}
      form="connect-sunsync"
    >
      {pending ? "Working…" : label}
    </Button>
  );
}

export function ConnectSunSyncModal({ children }: { children: ReactNode }) {
  const [result, formAction] = useActionState(
    async (_prev: SunSyncConnectResult | null, form: FormData) =>
      connectSunSync(form),
    INITIAL,
  );

  const pickingPlant = result !== null && "pickPlant" in result;
  const pickingInverter = result !== null && "pickInverter" in result;
  const succeeded = result !== null && result.ok === true;
  const genericError =
    result !== null && !result.ok && "error" in result ? result.error : null;

  const submitLabel = pickingPlant
    ? "Link this site"
    : pickingInverter
      ? "Link this inverter"
      : "Continue";

  return (
    <Modal>
      <Modal.Trigger>{children}</Modal.Trigger>
      <Modal.Backdrop>
        <Modal.Container size="lg" placement="center">
          <Modal.Dialog>
            <Modal.Header className="flex-row items-start gap-3">
              <Modal.Icon className="bg-[color:var(--efh-solar)]/10 text-[color:var(--efh-solar)]">
                <Sun className="size-5" />
              </Modal.Icon>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Modal.Heading>Connect SunSync</Modal.Heading>
                  {succeeded && (
                    <Chip color="success" variant="soft" size="sm">
                      Connected
                    </Chip>
                  )}
                  {pickingPlant && (
                    <Chip color="warning" variant="soft" size="sm">
                      Pick a site
                    </Chip>
                  )}
                  {pickingInverter && (
                    <Chip color="warning" variant="soft" size="sm">
                      Pick an inverter
                    </Chip>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted">
                  {pickingPlant
                    ? "Your Sunsynk account has more than one site. Pick the home this dashboard should read."
                    : pickingInverter
                      ? "This site has more than one inverter. Pick the one whose telemetry drives this dashboard."
                      : "Sign in with the same account you use for the SunSync app. We read your inverter's cloud API — nothing is installed on your hardware."}
                </p>
              </div>
            </Modal.Header>

            <Modal.Body>
              <form
                id="connect-sunsync"
                action={formAction}
                className="flex flex-col gap-5"
              >
                {genericError && (
                  <div
                    role="alert"
                    className="rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-danger"
                  >
                    {genericError}
                  </div>
                )}

                {/* Credential fields — mounted for every step. On picker
                    re-submits the user's original values are still in the
                    inputs so we don't have to ferry them through hidden
                    fields or React state. */}
                <TextInputField
                  name="email"
                  label="SunSync email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@example.com"
                  isRequired
                  autoFocus
                  description="The email you use to sign in to the SunSync app."
                />
                <PasswordField
                  name="password"
                  label="SunSync password"
                  autoComplete="current-password"
                  isRequired
                  description="Stored encrypted (AES-256-GCM); used only to talk to the SunSync API on your behalf."
                />

                {pickingPlant && "pickPlant" in result! && (
                  <fieldset className="rounded-lg border border-border bg-surface-secondary p-4">
                    <legend className="px-2 text-sm font-semibold text-foreground">
                      Which site?
                    </legend>
                    {/* `name="plantId"` is what eb-auth reads on the
                        second-pass POST; each Radio value carries the id
                        from the details[] array eb-auth returned. */}
                    <RadioGroup name="plantId" isRequired className="mt-2">
                      {result.pickPlant.map((plant) => (
                        <Radio key={plant.id} value={plant.id}>
                          {plant.label}
                        </Radio>
                      ))}
                    </RadioGroup>
                  </fieldset>
                )}

                {pickingInverter && "pickInverter" in result! && (
                  <fieldset className="rounded-lg border border-border bg-surface-secondary p-4">
                    <legend className="px-2 text-sm font-semibold text-foreground">
                      Which inverter?
                    </legend>
                    <RadioGroup name="inverterSerial" isRequired className="mt-2">
                      {result.pickInverter.map((inv) => (
                        <Radio key={inv.serial} value={inv.serial}>
                          {inv.label}
                        </Radio>
                      ))}
                    </RadioGroup>
                  </fieldset>
                )}

                {!pickingPlant && !pickingInverter && !succeeded && (
                  <p className="text-xs text-muted">
                    If your account has more than one plant or inverter, the
                    next step lets you pick which one to link.
                  </p>
                )}
              </form>
            </Modal.Body>

            <Modal.Footer>
              <Modal.CloseTrigger />
              <SubmitButton label={submitLabel} />
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
