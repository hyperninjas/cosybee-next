"use server";

import { revalidatePath } from "next/cache";
import {
  adminApi,
  TARIFF_FUELS,
  TARIFF_PAYMENTS,
  TARIFF_TYPES,
  type CreateTariffInput,
  type TariffDTO,
  type TariffFuel,
  type TariffPayment,
  type TariffProviderDTO,
  type TariffRegionRateInput,
  type TariffType,
} from "../lib/api";
import type { EntitySaveState, SaveState } from "../lib/form-state";
import { assertAdmin } from "../lib/auth";

function str(form: FormData, key: string): string {
  return (form.get(key) as string | null)?.trim() ?? "";
}
function optStr(form: FormData, key: string): string | null {
  const v = str(form, key);
  return v === "" ? null : v;
}

/**
 * Autocomplete search. Returns full tariffs (provider + all region rates), so
 * selecting a result needs no extra fetch.
 */
export async function searchTariffsAction(q: string): Promise<TariffDTO[]> {
  await assertAdmin();
  return adminApi.listTariffs({ q: q.trim() || undefined, limit: 20 });
}

/**
 * Create a tariff from the modal form. Returns the saved tariff so the page
 * can auto-select it into the editable table.
 */
export async function createTariffAction(
  _prev: EntitySaveState<TariffDTO>,
  formData: FormData,
): Promise<EntitySaveState<TariffDTO>> {
  await assertAdmin();

  const providerId = str(formData, "providerId");
  const providerName = str(formData, "providerName");
  const name = str(formData, "name");
  const type = str(formData, "type") as TariffType;
  const payment = str(formData, "payment") as TariffPayment;
  const fuelRaw = optStr(formData, "fuel");

  const fieldErrors: Record<string, string> = {};
  if (!providerId && !providerName)
    fieldErrors.providerId = "Pick a provider or enter a new one.";
  if (!name) fieldErrors.name = "Name is required.";
  if (!TARIFF_TYPES.includes(type)) fieldErrors.type = "Pick a type.";
  if (!TARIFF_PAYMENTS.includes(payment))
    fieldErrors.payment = "Pick a payment method.";
  if (fuelRaw && !TARIFF_FUELS.includes(fuelRaw as TariffFuel))
    fieldErrors.fuel = "Invalid fuel.";
  if (Object.keys(fieldErrors).length) {
    return { ok: false, error: "Fix the highlighted fields.", fieldErrors };
  }

  const input: CreateTariffInput = {
    // Existing provider wins; otherwise create by name.
    ...(providerId ? { providerId } : { providerName }),
    name,
    type,
    payment,
    fuel: (fuelRaw as TariffFuel | null) ?? null,
    term: optStr(formData, "term"),
    effectiveDate: optStr(formData, "effectiveDate"),
    exitFee: optStr(formData, "exitFee"),
    offPeakHours: optStr(formData, "offPeakHours"),
    note: optStr(formData, "note"),
    smartMeterRequired: formData.get("smartMeterRequired") === "on",
  };

  let entity: TariffDTO;
  try {
    entity = await adminApi.createTariff(input);
  } catch (e) {
    return { ok: false, error: `Could not create: ${(e as Error).message}` };
  }

  revalidatePath("/admin/tariffs");
  return { ok: true, entity };
}

/**
 * Persist edits to a tariff's per-region rates (from the editable table).
 * Called directly from the client with structured data — not FormData — since
 * the payload is a sparse matrix of numbers.
 */
export async function saveTariffRatesAction(
  id: string,
  regions: TariffRegionRateInput[],
): Promise<SaveState> {
  await assertAdmin();
  try {
    await adminApi.updateTariff(id, { regions });
  } catch (e) {
    return {
      ok: false,
      error: `Could not save rates: ${(e as Error).message}`,
    };
  }
  revalidatePath("/admin/tariffs");
  return { ok: true };
}

/**
 * Update a provider's info from the edit modal. Returns the saved provider so
 * the page can patch the currently-selected tariff's provider in place.
 * `isActive` is derived from `acquiredBy` to keep status consistent with ingest
 * (acquired ⇒ inactive).
 */
export async function updateProviderAction(
  _prev: EntitySaveState<TariffProviderDTO>,
  formData: FormData,
): Promise<EntitySaveState<TariffProviderDTO>> {
  await assertAdmin();

  const id = str(formData, "id");
  const name = str(formData, "name");
  if (!id) return { ok: false, error: "Missing provider id." };
  if (!name) {
    return {
      ok: false,
      error: "Add a name to save the provider.",
      fieldErrors: { name: "Name is required." },
    };
  }

  const acquiredBy = optStr(formData, "acquiredBy");

  let entity: TariffProviderDTO;
  try {
    entity = await adminApi.updateProvider(id, {
      name,
      isPopular: formData.get("isPopular") === "on",
      acquiredBy,
      note: optStr(formData, "note"),
      isActive: !acquiredBy,
    });
  } catch (e) {
    return { ok: false, error: `Could not save: ${(e as Error).message}` };
  }

  revalidatePath("/admin/tariffs");
  return { ok: true, entity };
}

/** Delete a tariff (used by the row/detail delete control). */
export async function deleteTariffAction(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  await assertAdmin();
  const id = str(formData, "id");
  if (!id) return { ok: false, error: "Missing tariff id." };
  try {
    await adminApi.deleteTariff(id);
  } catch (e) {
    return { ok: false, error: `Could not delete: ${(e as Error).message}` };
  }
  revalidatePath("/admin/tariffs");
  return { ok: true };
}
