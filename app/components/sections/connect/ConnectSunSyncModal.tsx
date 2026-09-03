"use client";
"use no memo";

import type { ReactNode } from "react";
import { startTransition, useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Description,
  FieldError,
  Fieldset,
  Form,
  InputGroup,
  Label,
  ListBox,
  Modal,
  Spinner,
  TextField,
  useOverlayState,
} from "@heroui/react";
import {
  CircleCheckFill,
  CircleExclamationFill,
  Sun,
} from "@gravity-ui/icons";
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
 * through hidden inputs.
 *
 * ### Redesign notes
 *
 *   • Header collapsed to a single tinted icon + title row — the step
 *     name lives in the 3-dot stepper below, not in a floating chip that
 *     duplicated the info.
 *   • Body has ONE focal card per step: credentials, plant picker, or
 *     inverter picker. Non-current-step markup is `hidden`, still in the
 *     DOM so its FormData values survive re-submits.
 *   • Loading uses a centred `Spinner` + rotating ladder of honest
 *     messages instead of a small inline card that was easy to miss on
 *     Sunsynk's 3–8 s round-trip.
 *   • Success uses an inline `CircleCheckFill` + heading, so the modal
 *     feels like it acknowledged the click before dismissing.
 *   • Errors show as a compact banner at the top of the body with a
 *     matching `CircleExclamationFill` — same visual grammar as success.
 */

const INITIAL: SunSyncConnectResult | null = null;
const FORM_ID = "connect-sunsync";

/**
 * Extract the single selected key from react-aria's `Selection` shape
 * (`"all" | Set<Key>`). Our ListBox uses `selectionMode="single"` so
 * `"all"` never fires and the Set holds 0 or 1 entries. Returns `null`
 * when nothing is selected, so callers can gate on truthiness.
 */
function firstKey(selection: "all" | Set<React.Key>): string | null {
  if (selection === "all") return null;
  const first = selection.values().next().value;
  return typeof first === "string" ? first : null;
}

/** One of the three logical steps in the flow. */
type Step = "credentials" | "plant" | "inverter";

/**
 * 3-dot stepper at the top of the modal body. Highlights the current
 * step; upcoming steps sit muted. The plant / inverter dots only light
 * up when the account actually surfaces those pickers — for a single-
 * site / single-inverter Sunsynk account the visual stays honest
 * (`current` collapses back to "credentials" once resolved and the
 * modal closes on its own).
 */
function Stepper({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "credentials", label: "Sign in" },
    { key: "plant", label: "Site" },
    { key: "inverter", label: "Inverter" },
  ];
  const activeIdx = steps.findIndex((s) => s.key === step);
  return (
    <ol className="flex items-center gap-2 text-xs">
      {steps.map((s, i) => {
        const isActive = i === activeIdx;
        const isDone = i < activeIdx;
        return (
          <li key={s.key} className="flex items-center gap-2">
            <span
              className={`flex size-6 items-center justify-center rounded-full text-[11px] font-semibold transition-colors ${
                isActive
                  ? "bg-[color:var(--efh-solar)] text-white"
                  : isDone
                    ? "bg-[color:var(--efh-solar)]/20 text-[color:var(--efh-solar)]"
                    : "bg-surface-secondary text-muted"
              }`}
            >
              {isDone ? "✓" : i + 1}
            </span>
            <span
              className={`font-medium ${
                isActive ? "text-foreground" : "text-muted"
              }`}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className={`ml-1 h-px w-6 ${
                  isDone
                    ? "bg-[color:var(--efh-solar)]/40"
                    : "bg-separator"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Centred loading state. Sunsynk's API is genuinely slow (3–8 s on a
 * good day). A cycling ladder of honest labels tells the customer WHAT
 * we're doing so a long wait doesn't read as "nothing happened". The
 * last message stays put so we never spin the label forever.
 */
const SYNC_MESSAGES = [
  "Signing in to Sunsynk…",
  "Fetching your site…",
  "Linking your inverter…",
  "Still working — Sunsynk can be slow at times…",
];

function LoadingCard() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (step >= SYNC_MESSAGES.length - 1) return;
    const t = setTimeout(() => setStep((s) => s + 1), 2000);
    return () => clearTimeout(t);
  }, [step]);
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl bg-surface-secondary px-6 py-10 text-center">
      <Spinner size="lg" />
      <div className="flex flex-col gap-1">
        <p className="text-base font-semibold text-foreground">
          Talking to Sunsynk
        </p>
        <p className="text-sm text-muted">{SYNC_MESSAGES[step]}</p>
      </div>
    </div>
  );
}

function ErrorBanner({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger"
    >
      <CircleExclamationFill className="mt-0.5 size-4 shrink-0" />
      <span className="flex-1">{children}</span>
    </div>
  );
}

function SuccessCard() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-success/30 bg-success/5 px-6 py-8 text-center">
      <CircleCheckFill className="size-8 text-success" />
      <div className="flex flex-col gap-1">
        <p className="text-base font-semibold text-foreground">
          Sunsynk linked
        </p>
        <p className="text-sm text-muted">Taking you to the next step…</p>
      </div>
    </div>
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

  const currentStep: Step = pickingInverter
    ? "inverter"
    : pickingPlant
      ? "plant"
      : "credentials";

  // Track picker selection locally so the submit button can be disabled
  // until the user actually chooses. Reset whenever the step changes so
  // the button re-locks on entry.
  const [selectedPlant, setSelectedPlant] = useState<string | null>(null);
  const [selectedInverter, setSelectedInverter] = useState<string | null>(null);
  useEffect(() => {
    if (pickingPlant) setSelectedPlant(null);
  }, [pickingPlant]);
  useEffect(() => {
    if (pickingInverter) setSelectedInverter(null);
  }, [pickingInverter]);

  // On success: close the modal and (in onboarding) navigate forward.
  const { close } = overlay;
  useEffect(() => {
    if (!succeeded) return;
    const t = setTimeout(() => {
      close();
      if (successHref) router.push(successHref);
    }, 700);
    return () => clearTimeout(t);
  }, [succeeded, successHref, close, router]);

  const submitLabel =
    currentStep === "plant"
      ? "Link this site"
      : currentStep === "inverter"
        ? "Link this inverter"
        : "Continue";

  // Credentials mounted for every step so re-submits carry them. Hidden
  // while the pickers or a syncing / success state own the body.
  const showCredentialsInBody = currentStep === "credentials" && !isPending && !succeeded;
  const showPlantInBody = currentStep === "plant" && !isPending && !succeeded;
  const showInverterInBody = currentStep === "inverter" && !isPending && !succeeded;

  // Submit button disabled when: action in flight, or the active picker
  // step has no selection. Credentials step relies on browser required-
  // field validation instead.
  const submitDisabled =
    isPending ||
    (currentStep === "plant" && !selectedPlant) ||
    (currentStep === "inverter" && !selectedInverter);

  return (
    <Modal state={overlay}>
      <Modal.Trigger>{children}</Modal.Trigger>
      <Modal.Backdrop>
        <Modal.Container size="lg" placement="center">
          <Modal.Dialog>
            {/* Form wraps every Modal slot so `type="submit"` on the
                footer button is a natural form descendant.

                🔴 `onSubmit` + `startTransition(() => formAction(fd))`
                instead of `<Form action={formAction}>`. React 19 auto-
                resets any form bound via the `action` prop as soon as
                the action returns; our multi-step flow returns
                `{pickPlant:[…]}` on pass 1, and the auto-reset would
                wipe the (hidden) credentials before pass 2. `formAction`
                from `useActionState` must be called inside a transition
                when dispatched manually — otherwise `isPending` never
                flips and React logs a warning. */}
            <Form
              id={FORM_ID}
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                startTransition(() => {
                  formAction(fd);
                });
              }}
            >
              <Modal.Header className="flex-row items-center gap-3">
                <Modal.Icon className="bg-[color:var(--efh-solar)]/10 text-[color:var(--efh-solar)]">
                  <Sun className="size-5" />
                </Modal.Icon>
                <div className="flex-1">
                  <Modal.Heading>Connect Sunsynk</Modal.Heading>
                  <p className="mt-0.5 text-sm text-muted">
                    {currentStep === "credentials"
                      ? "Sign in with the same account you use for the Sunsynk app."
                      : currentStep === "plant"
                        ? "Pick the home this dashboard should read."
                        : "Pick the inverter whose telemetry drives this dashboard."}
                  </p>
                </div>
              </Modal.Header>

              <Modal.Body className="flex flex-col gap-5">
                {/* Stepper hidden on success / loading — no need to
                    distract from the focal card that owns the moment. */}
                {!isPending && !succeeded && <Stepper step={currentStep} />}

                {isPending && <LoadingCard />}
                {succeeded && <SuccessCard />}
                {!isPending && !succeeded && genericError && (
                  <ErrorBanner>{genericError}</ErrorBanner>
                )}

                {/* Credentials — mounted for every step. `isRequired` only
                    on the credentials step because a required input inside
                    a `hidden` wrapper blocks form submit in Chrome ("not
                    focusable"). Missing values on picker re-submit are
                    caught server-side by `requiredString`. */}
                <Fieldset
                  hidden={!showCredentialsInBody}
                  className="flex flex-col gap-4"
                >
                  <TextField
                    name="email"
                    type="email"
                    isRequired={showCredentialsInBody}
                    autoFocus={showCredentialsInBody}
                  >
                    <Label>Sunsynk email</Label>
                    <InputGroup variant="secondary">
                      <InputGroup.Input
                        placeholder="you@example.com"
                        autoComplete="email"
                        inputMode="email"
                      />
                    </InputGroup>
                    <Description>
                      The email you use to sign in to the Sunsynk app.
                    </Description>
                    <FieldError />
                  </TextField>

                  <TextField
                    name="password"
                    type="password"
                    isRequired={showCredentialsInBody}
                  >
                    <Label>Sunsynk password</Label>
                    <InputGroup variant="secondary">
                      <InputGroup.Input autoComplete="current-password" />
                    </InputGroup>
                    <Description>
                      Stored encrypted (AES-256-GCM); used only to talk to
                      the Sunsynk API on your behalf.
                    </Description>
                    <FieldError />
                  </TextField>
                </Fieldset>

                {showPlantInBody && "pickPlant" in result! && (
                  <Fieldset className="flex flex-col gap-2">
                    <Fieldset.Legend>Sites on this account</Fieldset.Legend>
                    <ListBox
                      aria-label="Sunsynk site"
                      selectionMode="single"
                      selectedKeys={
                        selectedPlant ? new Set([selectedPlant]) : new Set()
                      }
                      onSelectionChange={(keys) =>
                        setSelectedPlant(firstKey(keys))
                      }
                      className="max-h-64 overflow-y-auto rounded-xl border border-border bg-surface"
                    >
                      {result.pickPlant.map((plant) => (
                        <ListBox.Item
                          key={plant.id}
                          id={plant.id}
                          textValue={plant.label}
                        >
                          {plant.label}
                        </ListBox.Item>
                      ))}
                    </ListBox>
                    <input
                      type="hidden"
                      name="plantId"
                      value={selectedPlant ?? ""}
                    />
                  </Fieldset>
                )}

                {showInverterInBody && "pickInverter" in result! && (
                  <Fieldset className="flex flex-col gap-2">
                    <Fieldset.Legend>Inverters at this site</Fieldset.Legend>
                    <ListBox
                      aria-label="Sunsynk inverter"
                      selectionMode="single"
                      selectedKeys={
                        selectedInverter
                          ? new Set([selectedInverter])
                          : new Set()
                      }
                      onSelectionChange={(keys) =>
                        setSelectedInverter(firstKey(keys))
                      }
                      className="max-h-64 overflow-y-auto rounded-xl border border-border bg-surface"
                    >
                      {result.pickInverter.map((inv) => (
                        <ListBox.Item
                          key={inv.serial}
                          id={inv.serial}
                          textValue={inv.label}
                        >
                          {inv.label}
                        </ListBox.Item>
                      ))}
                    </ListBox>
                    <input
                      type="hidden"
                      name="inverterSerial"
                      value={selectedInverter ?? ""}
                    />
                  </Fieldset>
                )}

                {showCredentialsInBody && (
                  <p className="text-xs text-muted">
                    If your account has more than one site or inverter,
                    the next step lets you pick which one to link.
                  </p>
                )}
              </Modal.Body>

              <Modal.Footer className="items-center gap-2">
                <Modal.CloseTrigger />
                {!succeeded && (
                  <Button
                    variant="primary"
                    type="submit"
                    isDisabled={submitDisabled}
                  >
                    {isPending ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Working…
                      </>
                    ) : (
                      submitLabel
                    )}
                  </Button>
                )}
              </Modal.Footer>
            </Form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
