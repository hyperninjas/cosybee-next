"use client";
"use no memo";

import type { ReactNode } from "react";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Chip,
  Modal,
  Radio,
  RadioGroup,
  Spinner,
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

/**
 * Card shown while the connect action is in flight. Sunsynk's cloud API is
 * genuinely slow (3–8 s on a good day, sometimes more), and the earlier
 * version left the picker on screen with no visible activity — customers
 * read that as "nothing happened".
 *
 * Cycles a small ladder of status messages every 2 s so the customer sees
 * motion. We don't get real progress from the backend (`client.discover`
 * is one blocking call end-to-end), so the messages are HONEST placeholders
 * describing what the backend is doing at that stage rather than fake
 * numeric progress. Cycling stops on the last message so a genuinely long
 * wait doesn't spin the labels forever.
 */
const SYNC_MESSAGES = [
  "Signing in to Sunsynk…",
  "Fetching your site…",
  "Linking your inverter…",
  "Still working — Sunsynk can be slow at times…",
];

function SyncingCard() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (step >= SYNC_MESSAGES.length - 1) return;
    const t = setTimeout(() => setStep((s) => s + 1), 2000);
    return () => clearTimeout(t);
  }, [step]);
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-secondary p-4">
      <Spinner size="sm" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">
          Talking to Sunsynk
        </p>
        <p className="text-xs text-muted">{SYNC_MESSAGES[step]}</p>
      </div>
    </div>
  );
}

/**
 * Submit button that lives INSIDE the form (form wraps Header/Body/Footer,
 * so the button is a descendant). Native `type="submit"` fires the form's
 * action; HeroUI's Button passes `type` through to its underlying <button>
 * so no onPress workaround is needed.
 *
 * An earlier iteration put the button in Modal.Footer OUTSIDE the form and
 * relied on `form={FORM_ID}` — react-aria-components' Button doesn't
 * reliably translate its synthetic PressEvent into a native submit dispatch
 * for a form-external button, so every click was silently swallowed.
 * Wrapping the form around Modal.Footer is the fix; it also lets
 * useFormStatus report pending correctly for descendants.
 */
function SubmitButton({ label, pending }: { label: string; pending: boolean }) {
  return (
    <Button variant="primary" type="submit" isDisabled={pending}>
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
  // `isPending` is the third slot of useActionState — true while the
  // server action is in flight. Preferred over useFormStatus here because
  // the submit button lives outside the form (see SubmitButton doc).
  const [result, formAction, isPending] = useActionState(
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
  // rather than the input UI the user has already finished with. Also
  // hidden while the connect action is in flight so the SyncingCard is
  // the only focal point on screen (Sunsynk's 3–8 s wait feels
  // interminable if the picker just sits there unresponsive).
  const hideCredentials = pickingPlant || pickingInverter || succeeded || isPending;
  const hidePicker = isPending;

  return (
    <Modal state={overlay}>
      <Modal.Trigger>{children}</Modal.Trigger>
      <Modal.Backdrop>
        <Modal.Container size="lg" placement="center">
          <Modal.Dialog>
            {/* form wraps every Modal slot below so `type="submit"` on the
                footer button is a natural form descendant.

                🔴 We DELIBERATELY use `onSubmit` + `formAction(fd)` instead
                of `<form action={formAction}>`. React 19 auto-resets any
                form bound via the `action` prop as soon as the action
                returns — regardless of whether the action succeeded or
                returned a validation error. Our multi-step flow returns
                `{pickPlant:[…]}` on the first pass; the auto-reset would
                then clear the (hidden) email + password inputs before the
                second pass, and the "Link this site" click would POST
                with empty credentials. The manual dispatch below is the
                supported opt-out. */}
            <form
              id={FORM_ID}
              onSubmit={(e) => {
                e.preventDefault();
                formAction(new FormData(e.currentTarget));
              }}
            >
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
              <div className="flex flex-col gap-5">
                {isPending && <SyncingCard />}
                {!isPending && genericError && (
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
                    fields or React state.

                    🔴 `isRequired` only on the credentials step, NEVER on
                    the picker step. When a required input sits inside a
                    `hidden` wrapper, the browser silently blocks form
                    submit because it can't scroll to / focus a hidden
                    input to show the "please fill out this field" bubble
                    — Chrome logs `An invalid form control with
                    name='email' is not focusable` and drops the submit
                    with no visible error. That was the entire "Link this
                    site does nothing" bug. Missing values on re-submit
                    are caught by `requiredString` inside the server
                    action instead. */}
                <div hidden={hideCredentials} className="flex flex-col gap-5">
                  <TextInputField
                    name="email"
                    label="Sunsynk email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="you@example.com"
                    isRequired={!hideCredentials}
                    autoFocus
                    description="The email you use to sign in to the Sunsynk app."
                  />
                  <PasswordField
                    name="password"
                    label="Sunsynk password"
                    autoComplete="current-password"
                    isRequired={!hideCredentials}
                    description="Stored encrypted (AES-256-GCM); used only to talk to the Sunsynk API on your behalf."
                  />
                </div>

                {pickingPlant && "pickPlant" in result! && !hidePicker && (
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

                {pickingInverter && "pickInverter" in result! && !hidePicker && (
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

                {!pickingPlant && !pickingInverter && !succeeded && !isPending && (
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
              </div>
            </Modal.Body>

            <Modal.Footer>
              <Modal.CloseTrigger />
              {/* Hide the submit on success — the effect above closes the
                  modal and (if provided) navigates on, so rendering an
                  active button would let the user re-fire the action. */}
              {!succeeded && <SubmitButton label={submitLabel} pending={isPending} />}
            </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
