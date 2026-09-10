"use client";

import type { ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";
import {
  Alert,
  Button,
  Description,
  Input,
  Label,
  Modal,
  Radio,
  RadioGroup,
  TextField,
  useOverlayState,
} from "@heroui/react";
import { Sliders } from "@gravity-ui/icons";

import { OPTION_CARD } from "@/app/components/ui/OptionCard";
import {
  BUILT_FORMS,
  CONSTRUCTION_ERAS,
  GLAZING_TYPES,
  HEATING_TYPES,
  HOT_WATER_TYPES,
  PROPERTY_TYPES,
  REFINE_STEP_COUNT,
  WALL_INSULATIONS,
  loftOptionsFor,
  type EpcOption,
} from "@/app/lib/epc-field-options";
import {
  builtFormWarnReason,
  floorAreaWarnReason,
  glazingBlockReason,
  heatingBlockReason,
  heatingWarnReason,
  hotWaterWarnReason,
  loftBlockReason,
  loftWarnReason,
  solarWarnReason,
  wallWarnReason,
} from "@/app/lib/epc-answer-rules";
import {
  updateSyntheticProfile,
  type SyntheticAnswers,
} from "@/app/lib/epc-actions";

/**
 * "Refine my estimate" — the 11-question flow behind the rating card, and
 * the web port of mobile's `edit_synthetic_epc_screen.dart`.
 *
 * Onboarding asks one question (construction era) and the estimator fills
 * the rest from era-typical values. This is where the resident replaces
 * those assumptions with what their home actually has, one question per
 * step, in the same order mobile uses.
 *
 * ### What the rules do here
 *
 *   • **Blocked** options are disabled and say why. Reserved for the
 *     genuinely impossible — a boiler older than the house it heats.
 *   • **Warned** answers show an inline note and let the resident continue.
 *     UK housing has exceptions everywhere; refusing on statistical grounds
 *     would lock out real homes.
 *
 * Blocks run *here* and not during onboarding, where the other answers are
 * system defaults rather than user assertions.
 *
 * ### Two deliberate choices
 *
 * **Only answered questions are sent.** Skipping a question leaves it
 * unset rather than filling a guess — the estimator supplies era-typical
 * values, and keeping "never answered" expressible is what lets this screen
 * pre-select real answers on the next visit.
 *
 * **Floor area and bedrooms are optional.** They aren't scored; they feed
 * heat-pump sizing and the consumption estimate. The flow can finish
 * without them.
 */

interface Props {
  /** Previous answers, for pre-selection. Empty on a first visit. */
  answers: SyntheticAnswers;
  /** The trigger — usually the card's "Refine" button. */
  children: ReactNode;
}

const FLOOR_AREA_MIN = 1;
const FLOOR_AREA_MAX = 2000;
const BEDROOM_MIN = 1;
const BEDROOM_MAX = 20;

export function RefineEstimateModal({ answers, children }: Props) {
  const overlay = useOverlayState();
  return (
    <Modal state={overlay}>
      <Modal.Trigger>{children}</Modal.Trigger>
      <Modal.Backdrop>
        <Modal.Container size="lg" placement="center">
          <Modal.Dialog>
            {/* Keyed on open state so every visit starts at question 1 with
                freshly-seeded answers, rather than resuming a half-finished
                run from a previous open. */}
            <RefineFlow
              key={overlay.isOpen ? "open" : "closed"}
              initial={answers}
              onDone={overlay.close}
            />
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function RefineFlow({
  initial,
  onDone,
}: {
  initial: SyntheticAnswers;
  onDone: () => void;
}) {
  const [answers, setAnswers] = useState<SyntheticAnswers>(initial);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Free-text rather than numbers: an empty field and a half-typed "1" are
  // both states a number can't hold, and clearing the box must mean
  // "unanswered", not zero.
  const [floorArea, setFloorArea] = useState(
    initial.floorArea !== undefined ? String(initial.floorArea) : "",
  );
  const [bedrooms, setBedrooms] = useState(
    initial.bedrooms !== undefined ? String(initial.bedrooms) : "",
  );

  const set = <K extends keyof SyntheticAnswers>(
    key: K,
    value: SyntheticAnswers[K],
  ) => {
    setError(null);
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const floorAreaValue = parseNumber(floorArea);
  const bedroomsValue = parseNumber(bedrooms);

  const floorAreaError =
    floorArea.trim().length > 0 &&
    (floorAreaValue === null ||
      floorAreaValue < FLOOR_AREA_MIN ||
      floorAreaValue > FLOOR_AREA_MAX)
      ? `Enter a floor area between ${FLOOR_AREA_MIN} and ${FLOOR_AREA_MAX} m².`
      : null;

  const bedroomsError =
    bedrooms.trim().length > 0 &&
    (bedroomsValue === null ||
      !Number.isInteger(bedroomsValue) ||
      bedroomsValue < BEDROOM_MIN ||
      bedroomsValue > BEDROOM_MAX)
      ? `Enter a whole number between ${BEDROOM_MIN} and ${BEDROOM_MAX}.`
      : null;

  const loftOptions = useMemo(
    () => loftOptionsFor(answers.propertyType),
    [answers.propertyType],
  );

  const steps = useMemo(
    () => [
      "propertyType",
      "builtForm",
      "constructionEra",
      "wallInsulation",
      "loftInsulation",
      "glazingType",
      "heatingType",
      "hotWater",
      "hasSolar",
      "floorArea",
      "bedrooms",
    ] as const,
    [],
  );

  const current = steps[step]!;
  const isLast = step === steps.length - 1;

  // Floor area and bedrooms are optional: block only on a value that is
  // present and wrong. Every other question needs an answer.
  const canProceed = (() => {
    switch (current) {
      case "hasSolar":
        return answers.hasSolar !== undefined;
      case "floorArea":
        return floorAreaError === null;
      case "bedrooms":
        return bedroomsError === null;
      default:
        return answers[current] !== undefined;
    }
  })();

  function handleNext() {
    if (!canProceed) return;
    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }
    const payload: SyntheticAnswers = { ...answers };
    if (floorAreaValue !== null) payload.floorArea = floorAreaValue;
    if (bedroomsValue !== null) payload.bedrooms = bedroomsValue;

    setError(null);
    startTransition(async () => {
      const result = await updateSyntheticProfile(payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onDone();
    });
  }

  return (
    <>
      <Modal.Header className="flex-row items-start gap-3">
        <Modal.Icon className="bg-accent/10 text-accent">
          <Sliders className="size-5" />
        </Modal.Icon>
        <div className="flex-1">
          <Modal.Heading>Refine your estimate</Modal.Heading>
          <p className="text-xs text-muted">
            Question {step + 1} of {REFINE_STEP_COUNT}
          </p>
        </div>
      </Modal.Header>

      <Modal.Body className="flex flex-col gap-4">
        {/* Progress. A plain bar rather than a step list — eleven numbered
            dots would dominate a dialog this size. */}
        <div
          className="h-1 w-full overflow-hidden rounded-full bg-surface-secondary"
          role="progressbar"
          aria-valuenow={step + 1}
          aria-valuemin={1}
          aria-valuemax={REFINE_STEP_COUNT}
          aria-label="Progress through the questions"
        >
          <div
            className="h-full rounded-full bg-accent transition-[width]"
            style={{ width: `${((step + 1) / REFINE_STEP_COUNT) * 100}%` }}
          />
        </div>

        {current === "propertyType" && (
          <OptionStep
            title="What type of property do you live in?"
            options={PROPERTY_TYPES}
            value={answers.propertyType}
            onChange={(v) => set("propertyType", v)}
          />
        )}

        {current === "builtForm" && (
          <OptionStep
            title="What is the form of your property?"
            options={BUILT_FORMS}
            value={answers.builtForm}
            onChange={(v) => set("builtForm", v)}
            warnFor={(v) => builtFormWarnReason(answers.propertyType, v)}
          />
        )}

        {current === "constructionEra" && (
          <OptionStep
            title="When was your home built?"
            options={CONSTRUCTION_ERAS}
            value={answers.constructionEra}
            onChange={(v) => set("constructionEra", v)}
          />
        )}

        {current === "wallInsulation" && (
          <OptionStep
            title="How are your walls insulated?"
            subtitle="A cavity wall is two skins with a gap between them. A solid wall has no gap."
            options={WALL_INSULATIONS}
            value={answers.wallInsulation}
            onChange={(v) => set("wallInsulation", v)}
            warnFor={(v) => wallWarnReason(answers.constructionEra, v)}
          />
        )}

        {current === "loftInsulation" && (
          <OptionStep
            title="How is your loft insulated?"
            options={loftOptions}
            value={answers.loftInsulation}
            onChange={(v) => set("loftInsulation", v)}
            blockFor={(v) => loftBlockReason(answers.propertyType, v)}
            warnFor={(v) => loftWarnReason(answers.constructionEra, v)}
          />
        )}

        {current === "glazingType" && (
          <OptionStep
            title="What type of windows do you have?"
            options={GLAZING_TYPES}
            value={answers.glazingType}
            onChange={(v) => set("glazingType", v)}
            blockFor={(v) => glazingBlockReason(answers.constructionEra, v)}
          />
        )}

        {current === "heatingType" && (
          <OptionStep
            title="What is your main heating system?"
            options={HEATING_TYPES}
            value={answers.heatingType}
            onChange={(v) => set("heatingType", v)}
            blockFor={(v) => heatingBlockReason(answers.constructionEra, v)}
            warnFor={(v) => heatingWarnReason(answers.propertyType, v)}
          />
        )}

        {current === "hotWater" && (
          <OptionStep
            title="How is your hot water heated?"
            options={HOT_WATER_TYPES}
            value={answers.hotWater}
            onChange={(v) => set("hotWater", v)}
            warnFor={(v) =>
              hotWaterWarnReason(answers.heatingType, answers.constructionEra, v)
            }
          />
        )}

        {current === "hasSolar" && (
          <OptionStep
            title="Do you have solar panels?"
            subtitle="Solar PV panels on your roof that generate electricity."
            options={SOLAR_OPTIONS}
            value={
              answers.hasSolar === undefined
                ? undefined
                : answers.hasSolar
                  ? "yes"
                  : "no"
            }
            onChange={(v) => set("hasSolar", v === "yes")}
            warnFor={(v) =>
              solarWarnReason(answers.propertyType, {
                hasSolar: v === "yes",
                loftIsNotApplicable: answers.loftInsulation === "dwelling_above",
              })
            }
          />
        )}

        {current === "floorArea" && (
          <NumberStep
            title="What is your floor area?"
            subtitle="Optional — it helps size a heat pump and estimate your usage."
            suffix="m²"
            value={floorArea}
            onChange={setFloorArea}
            error={floorAreaError}
            warning={
              floorAreaValue !== null && floorAreaError === null
                ? floorAreaWarnReason(
                    answers.propertyType,
                    answers.builtForm,
                    floorAreaValue,
                  )
                : null
            }
          />
        )}

        {current === "bedrooms" && (
          <NumberStep
            title="How many bedrooms?"
            subtitle="Optional."
            value={bedrooms}
            onChange={setBedrooms}
            error={bedroomsError}
            warning={null}
          />
        )}

        {error && (
          <Alert status="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description>{error}</Alert.Description>
            </Alert.Content>
          </Alert>
        )}
      </Modal.Body>

      <Modal.Footer>
        {step > 0 && (
          <Button
            variant="tertiary"
            isDisabled={pending}
            onPress={() => setStep((s) => s - 1)}
          >
            Back
          </Button>
        )}
        <Button
          variant="primary"
          isDisabled={!canProceed || pending}
          onPress={handleNext}
        >
          {pending ? "Saving…" : isLast ? "Save and update my rating" : "Next"}
        </Button>
      </Modal.Footer>
    </>
  );
}

const SOLAR_OPTIONS: readonly EpcOption[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

/**
 * One radio question.
 *
 * A blocked option is rendered disabled with its reason underneath, rather
 * than hidden: the resident learns why the combination can't be, instead of
 * hunting for an option that silently vanished.
 */
function OptionStep<T extends string>({
  title,
  subtitle,
  options,
  value,
  onChange,
  blockFor,
  warnFor,
}: {
  title: string;
  subtitle?: string;
  options: readonly EpcOption<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  blockFor?: (value: T) => string | null;
  warnFor?: (value: T) => string | null;
}) {
  const warning = value !== undefined ? (warnFor?.(value) ?? null) : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>

      <RadioGroup
        aria-label={title}
        className="flex flex-col gap-2"
        value={value ?? ""}
        onChange={(next) => onChange(next as T)}
      >
        {options.map((option) => {
          const blocked = blockFor?.(option.value) ?? null;
          return (
            <Radio
              key={option.value}
              value={option.value}
              isDisabled={blocked !== null}
              className={OPTION_CARD}
            >
              <Radio.Control>
                <Radio.Indicator />
              </Radio.Control>
              <Radio.Content>
                <span className="text-sm font-medium text-foreground">
                  {option.label}
                </span>
                {blocked && (
                  <span className="mt-0.5 text-xs text-muted">{blocked}</span>
                )}
              </Radio.Content>
            </Radio>
          );
        })}
      </RadioGroup>

      {warning && (
        <Alert status="warning">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{warning}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}
    </div>
  );
}

/** One optional numeric question — floor area or bedrooms. */
function NumberStep({
  title,
  subtitle,
  suffix,
  value,
  onChange,
  error,
  warning,
}: {
  title: string;
  subtitle?: string;
  suffix?: string;
  value: string;
  onChange: (value: string) => void;
  error: string | null;
  warning: string | null;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>

      <TextField value={value} onChange={onChange} isInvalid={error !== null}>
        <Label className="sr-only">{title}</Label>
        <Input inputMode="decimal" placeholder={suffix ? `e.g. 95 ${suffix}` : "e.g. 3"} />
        {error && <Description className="text-danger">{error}</Description>}
      </TextField>

      {warning && (
        <Alert status="warning">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{warning}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}
    </div>
  );
}

/** Null for anything that isn't a finite number, including an empty box. */
function parseNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}
