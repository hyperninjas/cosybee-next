"use client";

import { useState } from "react";
import { Button, Label, Modal, NumberField } from "@heroui/react";
import {
  SPACING_LIMITS,
  SPACING_PROPS,
  type SpacingProp,
  type SpacingValues,
} from "@/app/lib/blocknoteSchema";

const SIDES = ["Top", "Right", "Bottom", "Left"] as const;

/**
 * Margin/padding overrides for one block (see `withSpacing` in
 * blocknoteSchema.ts). Opened from the block's drag-handle menu.
 *
 * A blank field means "not set" — the block keeps the article stylesheet's
 * spacing for that side — so an author only overrides what they fill in, and
 * "Reset" returns the block to the defaults entirely.
 *
 * Mounted by the editor only while open, keyed by block, so the form state
 * starts from that block's props every time rather than syncing in an effect.
 *
 * `"use no memo"` — React-Compiler exempt like every editor component (see
 * Editor.tsx).
 */
export function SpacingDialog({
  blockLabel,
  initial,
  onApply,
  onClose,
}: {
  /** Human name of the block, for the heading ("Heading 2", "Image"…). */
  blockLabel: string;
  initial: SpacingValues;
  onApply: (values: Record<SpacingProp, string>) => void;
  onClose: () => void;
}) {
  "use no memo";
  const [values, setValues] = useState<Record<SpacingProp, string>>(() => {
    const start = {} as Record<SpacingProp, string>;
    for (const prop of SPACING_PROPS) start[prop] = initial[prop] ?? "";
    return start;
  });

  function set(prop: SpacingProp, n: number) {
    // React Aria reports a cleared field as NaN — that is "not set".
    setValues((v) => ({ ...v, [prop]: Number.isNaN(n) ? "" : String(n) }));
  }

  function reset() {
    const cleared = {} as Record<SpacingProp, string>;
    for (const prop of SPACING_PROPS) cleared[prop] = "";
    setValues(cleared);
  }

  const group = (kind: "margin" | "padding") => (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-sm font-semibold text-foreground">
        {kind === "margin" ? "Margin" : "Padding"}
      </legend>
      <div className="grid grid-cols-2 gap-3">
        {SIDES.map((side) => {
          const prop = `${kind}${side}` as SpacingProp;
          return (
            <NumberField
              key={prop}
              value={values[prop] === "" ? NaN : Number(values[prop])}
              onChange={(n) => set(prop, n)}
              minValue={SPACING_LIMITS[kind].min}
              maxValue={SPACING_LIMITS[kind].max}
              step={4}
              formatOptions={{ maximumFractionDigits: 0 }}
              fullWidth
            >
              <Label className="text-xs text-muted">{side} (px)</Label>
              <NumberField.Group>
                <NumberField.DecrementButton />
                <NumberField.Input placeholder="Default" />
                <NumberField.IncrementButton />
              </NumberField.Group>
            </NumberField>
          );
        })}
      </div>
    </fieldset>
  );

  return (
    <Modal.Backdrop
      isOpen
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Modal.Container size="md">
        <Modal.Dialog>
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>{blockLabel} spacing</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="flex flex-col gap-6">
            <p className="text-sm text-muted">
              Leave a field blank to keep the default. Vertical margins between
              two blocks overlap, so the gap is the larger of one block&apos;s
              bottom margin and the next block&apos;s top margin.
            </p>
            {group("margin")}
            {group("padding")}
          </Modal.Body>
          <Modal.Footer className="justify-between">
            <Button variant="ghost" onPress={reset}>
              Reset to default
            </Button>
            <div className="flex gap-2">
              <Button slot="close" variant="tertiary">
                Cancel
              </Button>
              <Button
                variant="primary"
                onPress={() => {
                  onApply(values);
                  onClose();
                }}
              >
                Apply
              </Button>
            </div>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
