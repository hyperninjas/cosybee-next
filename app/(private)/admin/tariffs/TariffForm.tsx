"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  Alert,
  Button,
  Card,
  ComboBox,
  Input,
  ListBox,
  ListBoxItem,
  Select,
  Switch,
  TextArea,
} from "@heroui/react";
import type { TariffDTO, TariffProviderDTO } from "../lib/api";
import { PublicImageUpload } from "@/app/components/storage/PublicImageUpload";
import { createTariffAction } from "./actions";
import { initialSaveState, type EntitySaveState } from "../lib/form-state";

const PNG_ONLY = ["image/png"] as const;

const TYPE_OPTIONS: { key: string; label: string }[] = [
  { key: "fixed", label: "Fixed" },
  { key: "variable", label: "Variable" },
  { key: "tracker", label: "Tracker" },
  { key: "agile", label: "Agile" },
  { key: "economy_7", label: "Economy 7" },
  { key: "time_of_use", label: "Time of use" },
  { key: "ev", label: "EV" },
  { key: "heat_pump", label: "Heat pump" },
  { key: "export", label: "Export / SEG" },
];

const PAYMENT_OPTIONS: { key: string; label: string }[] = [
  { key: "direct_debit", label: "Direct debit" },
  { key: "on_receipt", label: "On receipt of bill" },
];

const FUEL_OPTIONS: { key: string; label: string }[] = [
  { key: "", label: "— Not set —" },
  { key: "dual_fuel", label: "Dual fuel" },
  { key: "electricity_only", label: "Electricity only" },
];

function Labeled({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="mb-1 block text-sm font-semibold text-foreground">
        {label}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs font-medium text-danger">
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-muted">{hint}</span>
      ) : null}
    </div>
  );
}

/** HeroUI Select wired for a controlled value + a hidden input so the value
 *  reaches the form action's FormData. */
function SelectField({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { key: string; label: string }[];
  ariaLabel: string;
}) {
  return (
    <Select
      aria-label={ariaLabel}
      variant="secondary"
      fullWidth
      selectedKey={value}
      onSelectionChange={(k) => onChange(String(k))}
    >
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {options.map((o) => (
            <ListBoxItem key={o.key} id={o.key} textValue={o.label}>
              {o.label}
            </ListBoxItem>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="primary"
      isDisabled={pending}
      isPending={pending}
    >
      Create tariff
    </Button>
  );
}

export function TariffForm({
  providers,
  onSaved,
  onCancel,
}: {
  providers: TariffProviderDTO[];
  onSaved?: (saved?: TariffDTO) => void;
  onCancel?: () => void;
}) {
  const [state, formAction] = useActionState<
    EntitySaveState<TariffDTO>,
    FormData
  >(createTariffAction, initialSaveState);
  const errors = state?.fieldErrors ?? {};

  // Fire onSaved once per action result via a ref — see ProviderForm for why
  // depending on `onSaved` here loops (router.refresh/setState → re-render →
  // new onSaved identity → effect re-fires → "Maximum update depth exceeded").
  const onSavedRef = useRef(onSaved);
  useEffect(() => {
    onSavedRef.current = onSaved;
  });
  useEffect(() => {
    if (state?.ok) onSavedRef.current?.(state.entity);
  }, [state]);

  // Provider: pick an existing one (sets `providerId`) or type a new name
  // (`providerId` stays empty and `providerQuery` is sent as `providerName`,
  // which the backend find-or-creates).
  const [providerId, setProviderId] = useState("");
  const [providerQuery, setProviderQuery] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("fixed");
  const [payment, setPayment] = useState("direct_debit");
  const [fuel, setFuel] = useState("");
  const [smartMeter, setSmartMeter] = useState(false);
  const [providerLogo, setProviderLogo] = useState("");

  const q = providerQuery.trim().toLowerCase();
  const providerMatches = providers
    .filter((p) => (q ? p.name.toLowerCase().includes(q) : true))
    .slice(0, 8);
  const isNewProvider =
    !providerId &&
    providerQuery.trim() !== "" &&
    !providers.some((p) => p.name.toLowerCase() === q);

  return (
    <form action={formAction} className="space-y-5">
      {/* Hidden inputs carry the controlled Select/Switch values into FormData */}
      <input type="hidden" name="providerId" value={providerId} />
      <input
        type="hidden"
        name="providerName"
        value={providerId ? "" : providerQuery.trim()}
      />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="payment" value={payment} />
      <input type="hidden" name="fuel" value={fuel} />
      <input
        type="hidden"
        name="smartMeterRequired"
        value={smartMeter ? "on" : ""}
      />
      <input type="hidden" name="providerLogo" value={providerLogo} />

      {state?.error && (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{state.error}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      <Card>
        <Card.Header>
          <Card.Title className="text-sm font-semibold">Basics</Card.Title>
        </Card.Header>
        <Card.Content className="space-y-3">
          <Labeled
            label="Provider"
            error={errors.providerId}
            hint={
              isNewProvider
                ? `New provider “${providerQuery.trim()}” will be created.`
                : "Pick an existing provider or type a new name."
            }
          >
            <ComboBox
              aria-label="Provider"
              items={providerMatches}
              menuTrigger="input"
              allowsCustomValue
              inputValue={providerQuery}
              onInputChange={(v) => {
                setProviderQuery(v);
                // Moving off a selected provider (typing to create a new one)
                // drops that provider's auto-filled logo so it isn't attached
                // to a different provider. A logo uploaded for the new provider
                // (providerId already "") is left untouched.
                if (providerId) setProviderLogo("");
                setProviderId("");
              }}
              onSelectionChange={(key) => {
                if (key == null) return;
                const p = providers.find((x) => x.id === String(key));
                if (p) {
                  setProviderId(p.id);
                  setProviderQuery(p.name);
                  // Prefill the existing provider's logo (if it has one).
                  setProviderLogo(p.logoUrl ?? "");
                }
              }}
            >
              <ComboBox.InputGroup>
                <Input
                  variant="secondary"
                  fullWidth
                  maxLength={150}
                  placeholder="Search or type a new provider…"
                />
              </ComboBox.InputGroup>
              <ComboBox.Popover>
                <ListBox
                  renderEmptyState={() => (
                    <div className="px-3 py-2 text-sm text-muted">
                      No match — keep typing to create a new provider.
                    </div>
                  )}
                >
                  {(p: TariffProviderDTO) => (
                    <ListBoxItem id={p.id} textValue={p.name}>
                      {p.name}
                    </ListBoxItem>
                  )}
                </ListBox>
              </ComboBox.Popover>
            </ComboBox>
          </Labeled>
          <Labeled
            label="Provider logo"
            hint="PNG only — applied to the selected/new provider."
          >
            <PublicImageUpload
              context="provider-logo"
              library
              libraryFolderSlug="provider-logos"
              acceptMime={PNG_ONLY}
              value={providerLogo || null}
              onChange={(url) => setProviderLogo(url ?? "")}
              previewHeight="h-24"
              alt="Provider logo"
            />
          </Labeled>
          <Labeled label="Name" error={errors.name}>
            <Input
              variant="secondary"
              fullWidth
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={200}
              placeholder="e.g. Agile Octopus"
            />
          </Labeled>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Labeled label="Type" error={errors.type}>
              <SelectField
                ariaLabel="Type"
                value={type}
                onChange={setType}
                options={TYPE_OPTIONS}
              />
            </Labeled>
            <Labeled label="Payment" error={errors.payment}>
              <SelectField
                ariaLabel="Payment"
                value={payment}
                onChange={setPayment}
                options={PAYMENT_OPTIONS}
              />
            </Labeled>
          </div>
          <Labeled label="Fuel" error={errors.fuel}>
            <SelectField
              ariaLabel="Fuel"
              value={fuel}
              onChange={setFuel}
              options={FUEL_OPTIONS}
            />
          </Labeled>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title className="text-sm font-semibold">Details</Card.Title>
        </Card.Header>
        <Card.Content className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Labeled label="Term" hint="e.g. 12 months, No fixed term">
              <Input
                variant="secondary"
                fullWidth
                name="term"
                maxLength={100}
                placeholder="12 months"
              />
            </Labeled>
            <Labeled label="Effective date" hint="As published, e.g. 2026">
              <Input
                variant="secondary"
                fullWidth
                name="effectiveDate"
                maxLength={50}
                placeholder="2026"
              />
            </Labeled>
          </div>
          <Labeled label="Exit fee" hint="Free text, e.g. £25 per fuel">
            <Input
              variant="secondary"
              fullWidth
              name="exitFee"
              maxLength={150}
              placeholder="None"
            />
          </Labeled>
          <Labeled label="Off-peak hours" hint="For TOU / EV / E7 tariffs">
            <Input
              variant="secondary"
              fullWidth
              name="offPeakHours"
              maxLength={200}
              placeholder="00:00–05:00"
            />
          </Labeled>
          <Labeled label="Note">
            <TextArea variant="secondary" fullWidth name="note" rows={2} />
          </Labeled>
          <Switch
            isSelected={smartMeter}
            onChange={setSmartMeter}
            className="justify-between"
          >
            <Switch.Content>
              <span className="block text-sm font-semibold text-foreground">
                Smart meter required
              </span>
            </Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch>
        </Card.Content>
      </Card>

      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            Cancel
          </button>
        )}
        <SaveButton />
      </div>
    </form>
  );
}
