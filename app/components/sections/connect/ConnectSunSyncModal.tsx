"use client";

import type { ReactNode } from "react";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Button,
  Chip,
  Modal,
  Radio,
  RadioGroup,
  useOverlayState,
} from "@heroui/react";
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
const FORM_ID = "connect-sunsync";

/**
 * Single row in the plant / inverter picker. HeroUI's Radio is a compound
 * component — rendering just `<Radio>label</Radio>` shows only the label
 * (no dot), which is why the earlier version looked like a bare text list.
 * Compose Control/Indicator/Content and give the row a card-style hit area
 * so the whole line is clickable.
 */
function PickerRow({ value, label }: { value: string; label: string }) {
  return (
    <Radio
      value={value}
      className="flex cursor-pointer items-center gap-3 rounded-md border border-border bg-surface px-3 py-2.5 text-sm transition-colors hover:border-foreground/30 hover:bg-surface-tertiary data-[selected=true]:border-[color:var(--efh-solar)] data-[selected=true]:bg-[color:var(--efh-solar)]/5"
    >
      <Radio.Control>
        <Radio.Indicator />
      </Radio.Control>
      <Radio.Content className="flex-1 text-foreground">{label}</Radio.Content>
    </Radio>
  );
}

/**
 * Fire the form's submit as soon as the user picks a radio — one gesture
 * advances to the next step instead of "pick, then hunt for the button".
 * The credential inputs are still mounted, so plantId / inverterSerial ride
 * along with the same email + password the user already typed.
 */
function autoSubmit() {
  const form = document.getElementById(FORM_ID);
  if (form instanceof HTMLFormElement) form.requestSubmit();
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      variant="primary"
      type="submit"
      isDisabled={pending}
      form={FORM_ID}
    >
      {pending ? "Working…" : label}
    </Button>
  );
}

export function ConnectSunSyncModal({
  children,
  successHref,
}: {
  children: ReactNode;
  /**
   * Where to send the user after a successful connect. When set, the modal
   * closes and navigates to this URL as soon as the connect flow returns
   * `ok:true` — used by the onboarding funnel to advance to the next step.
   * Unset when the modal is opened from the dashboard: revalidatePath in
   * the action already updates the current page, so we just close.
   */
  successHref?: string;
}) {
  const [result, formAction] = useActionState(
    async (_prev: SunSyncConnectResult | null, form: FormData) =>
      connectSunSync(form),
    INITIAL,
  );
  const overlay = useOverlayState();
  const router = useRouter();

  const pickingPlant = result !== null && "pickPlant" in result;
  const pickingInverter = result !== null && "pickInverter" in result;
  const succeeded = result !== null && result.ok === true;
  const genericError =
    result !== null && !result.ok && "error" in result ? result.error : null;

  // On success: close the modal and (in onboarding) navigate forward.
  // `close` is a useCallback-stable ref from useOverlayState; `router` is
  // stable across renders. So the effect only re-runs when `succeeded` /
  // `successHref` change — no repeated router.push per re-render.
  const { close } = overlay;
  useEffect(() => {
    if (!succeeded) return;
    close();
    if (successHref) router.push(successHref);
  }, [succeeded, successHref, close, router]);

  const submitLabel = pickingPlant
    ? "Link this site"
    : pickingInverter
      ? "Link this inverter"
      : "Continue";

  // Credentials + picker are all hidden on success — the effect above will
  // dismiss the modal on the next paint, so we just show a confirmation
  // rather than the input UI the user has already finished with.
  const hideCredentials = pickingPlant || pickingInverter || succeeded;

  return (
    <Modal state={overlay}>
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
                  <Modal.Heading>Connect Sunsynk</Modal.Heading>
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
                      : "Sign in with the same account you use for the Sunsynk app. We read your inverter's cloud API — nothing is installed on your hardware."}
                </p>
              </div>
            </Modal.Header>

            <Modal.Body>
              <form
                id={FORM_ID}
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
                    fields or React state. The wrapper is `hidden` during
                    the picker so the user isn't asked to re-enter what
                    they already typed — the inputs still submit because
                    `hidden` (and `display:none`) doesn't disable form
                    controls, only the `disabled` attribute does. */}
                <div hidden={hideCredentials} className="flex flex-col gap-5">
                  <TextInputField
                    name="email"
                    label="Sunsynk email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="you@example.com"
                    isRequired
                    autoFocus
                    description="The email you use to sign in to the Sunsynk app."
                  />
                  <PasswordField
                    name="password"
                    label="Sunsynk password"
                    autoComplete="current-password"
                    isRequired
                    description="Stored encrypted (AES-256-GCM); used only to talk to the Sunsynk API on your behalf."
                  />
                </div>

                {pickingPlant && "pickPlant" in result! && (
                  <fieldset className="rounded-lg border border-border bg-surface-secondary p-4">
                    <legend className="px-2 text-sm font-semibold text-foreground">
                      Which site?
                    </legend>
                    {/* `name="plantId"` is what eb-auth reads on the
                        second-pass POST; each Radio value carries the id
                        from the details[] array eb-auth returned.
                        onChange auto-submits so the user advances to the
                        next step with a single click. */}
                    <RadioGroup
                      name="plantId"
                      isRequired
                      className="mt-2 max-h-72 gap-2 overflow-y-auto pr-1"
                      onChange={autoSubmit}
                    >
                      {result.pickPlant.map((plant) => (
                        <PickerRow
                          key={plant.id}
                          value={plant.id}
                          label={plant.label}
                        />
                      ))}
                    </RadioGroup>
                  </fieldset>
                )}

                {pickingInverter && "pickInverter" in result! && (
                  <fieldset className="rounded-lg border border-border bg-surface-secondary p-4">
                    <legend className="px-2 text-sm font-semibold text-foreground">
                      Which inverter?
                    </legend>
                    <RadioGroup
                      name="inverterSerial"
                      isRequired
                      className="mt-2 max-h-72 gap-2 overflow-y-auto pr-1"
                      onChange={autoSubmit}
                    >
                      {result.pickInverter.map((inv) => (
                        <PickerRow
                          key={inv.serial}
                          value={inv.serial}
                          label={inv.label}
                        />
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

                {succeeded && (
                  <div className="rounded-lg border border-success/30 bg-success/10 p-4 text-sm text-success">
                    Your inverter is linked. Taking you to the next step…
                  </div>
                )}
              </form>
            </Modal.Body>

            <Modal.Footer>
              <Modal.CloseTrigger />
              {/* Hide the submit on success — the effect above closes the
                  modal and (if provided) navigates on, so rendering an
                  active button would let the user re-fire the action. */}
              {!succeeded && <SubmitButton label={submitLabel} />}
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
