import { connection } from "next/server";
import { adminApi } from "../lib/api";
import { TariffsManager } from "./TariffsManager";

export default async function AdminTariffsPage() {
  // Render per-request — the live, no-store fetches in adminApi would
  // otherwise run during `next build` static collection.
  await connection();

  const [providers, regions] = await Promise.all([
    adminApi.getTariffProviders(),
    adminApi.getTariffRegions(),
  ]);

  return (
    <div className="space-y-6">
      <TariffsManager providers={providers} regions={regions} />
    </div>
  );
}
