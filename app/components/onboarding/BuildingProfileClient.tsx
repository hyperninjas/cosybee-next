"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Chip, Radio, RadioGroup } from "@heroui/react";
import {
  createPropertyFromEpc,
  createPropertyWithoutEpc,
  type EpcCertificateRow,
  type ResolvedAddress,
} from "@/app/lib/onboarding-actions";

/**
 * Client half of the building-profile step. The server component upstream
 * has already resolved the address (via `retrieveAddress`) and looked up
 * the EPC records for the postcode (via `searchEpcByPostcode`). This
 * component handles the interactive parts:
 *
 *   • Pick an EPC (pre-selected: the first row — usually the exact match).
 *   • Or fall into the "no EPC" fallback (button reveals plain form; the
 *     address / postcode are pre-filled from what AFD returned).
 *   • Submit → server action → next step.
 *
 * Everything downstream matches the mobile app's flow: property is
 * auto-created AND auto-activated by the backend, so no separate activate
 * step is needed here.
 */

interface Props {
  address: ResolvedAddress;
  epcs: EpcCertificateRow[];
}

export function BuildingProfileClient({ address, epcs }: Props) {
  const router = useRouter();
  const [certificateNumber, setCertificateNumber] = useState<string>(
    epcs[0]?.certificateNumber ?? "",
  );
  const [useNoEpc, setUseNoEpc] = useState(epcs.length === 0);
  // A one-word "Home" reads better than a truncated street when the user
  // only has one property; multi-property users can rename later.
  const [label, setLabel] = useState("Home");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      const result = useNoEpc
        ? await createPropertyWithoutEpc({
            label,
            address: displayAddress(address),
            postcode: address.postcode,
          })
        : await createPropertyFromEpc({ certificateNumber, label });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/onboarding/connect-sunsync");
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Selected address summary — the user can click "Change" to go back
          to step 1 if they picked the wrong one. */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-xs uppercase tracking-wide text-muted">Your home</p>
            <p className="text-sm font-semibold text-foreground">
              {displayAddress(address)}
            </p>
            <p className="text-xs text-muted">{address.postcode}</p>
          </div>
          <Button
            variant="tertiary"
            size="sm"
            onPress={() => router.push("/onboarding/address")}
          >
            Change
          </Button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-danger"
        >
          {error}
        </div>
      )}

      {/* Label — small optional friendly name; defaults to town so the user
          isn't forced to think of one but can rename if they have two homes. */}
      <div className="flex flex-col gap-2">
        <label htmlFor="home-label" className="text-sm font-medium text-foreground">
          Give this home a name (optional)
        </label>
        <input
          id="home-label"
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Home"
          className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-base text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {epcs.length > 0 && !useNoEpc && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-foreground">
            We found {epcs.length} EPC{epcs.length === 1 ? "" : "s"} for this postcode.
            Pick yours:
          </p>
          <RadioGroup
            aria-label="EPC certificate"
            value={certificateNumber}
            onChange={setCertificateNumber}
            className="flex flex-col gap-2"
          >
            {epcs.map((cert) => (
              <Radio key={cert.certificateNumber} value={cert.certificateNumber}>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">
                    {cert.address ?? cert.certificateNumber}
                    {cert.currentEnergyRating && (
                      <Chip color="default" variant="soft" size="sm" className="ml-2">
                        Rating {cert.currentEnergyRating}
                      </Chip>
                    )}
                  </span>
                  <span className="text-xs text-muted">
                    {[cert.propertyType, cert.builtForm, cert.totalFloorArea && `${cert.totalFloorArea} m²`]
                      .filter(Boolean)
                      .join(" · ")}
                    {cert.lodgementDate && ` · Lodged ${cert.lodgementDate}`}
                  </span>
                </div>
              </Radio>
            ))}
          </RadioGroup>
          <button
            type="button"
            onClick={() => setUseNoEpc(true)}
            className="self-start text-xs text-muted underline underline-offset-2 hover:text-foreground"
          >
            None of these are my home — continue without an EPC
          </button>
        </div>
      )}

      {(epcs.length === 0 || useNoEpc) && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-warning-foreground">
          <p className="font-semibold">
            {epcs.length === 0
              ? "We couldn't find an EPC for this postcode."
              : "Continue without an EPC."}
          </p>
          <p className="mt-1 text-warning-foreground/80">
            No problem &mdash; we&apos;ll set your home up from the address
            alone. You can add EPC details later from Settings.
          </p>
          {epcs.length > 0 && (
            <button
              type="button"
              onClick={() => setUseNoEpc(false)}
              className="mt-3 text-xs underline underline-offset-2"
            >
              Actually, let me pick from the EPC list
            </button>
          )}
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <Button
          variant="primary"
          onPress={handleCreate}
          isDisabled={pending || (!useNoEpc && certificateNumber.length === 0)}
        >
          {pending ? "Setting up your home…" : "Continue"}
        </Button>
      </div>
    </div>
  );
}

function displayAddress(addr: ResolvedAddress): string {
  return [addr.street, addr.locality, addr.town, addr.county]
    .filter((p) => p && p.length > 0)
    .join(", ");
}
