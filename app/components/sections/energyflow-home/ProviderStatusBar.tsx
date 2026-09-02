import { Button, Chip } from "@heroui/react";
import { CircleCheckFill, Sun, ThunderboltFill } from "@gravity-ui/icons";
import { ConnectSunSyncModal } from "@/app/components/sections/connect/ConnectSunSyncModal";
import { ConnectOctopusModal } from "@/app/components/sections/connect/ConnectOctopusModal";
import { ManageSunSyncModal } from "@/app/components/sections/manage/ManageSunSyncModal";
import { ManageOctopusModal } from "@/app/components/sections/manage/ManageOctopusModal";

/**
 * Persistent connections summary on the dashboard.
 *
 * Rendered above the dashboard grid whenever the user is in the connected
 * tier (any provider linked). Each provider gets one row:
 *
 *   • connected → "Connected" chip + last-sync timestamp
 *   • not connected → an inline "Connect" button that opens the same
 *     modal used on the Tier-0 empty state
 *
 * Reusing the modals keeps ONE source of truth for the connect UI — a
 * change to the SunSync flow lands here and on the empty state at the
 * same time, without a second copy to drift.
 */

interface ProviderRowProps {
  connected: boolean;
  title: string;
  subtitle: string;
  accent: "solar" | "grid";
  ConnectModal: React.ComponentType<{ children: React.ReactNode }>;
  /**
   * Post-connect management dialog (disconnect, switch inverter, etc.). Only
   * mounted when `connected === true`. Split from `ConnectModal` because the
   * two dialogs have unrelated content — merging them would make the connect
   * dialog a mode-switch on itself.
   */
  ManageModal: React.ComponentType<{ children: React.ReactNode }>;
}

function ProviderRow({
  connected,
  title,
  subtitle,
  accent,
  ConnectModal,
  ManageModal,
}: ProviderRowProps) {
  const tone = accent === "solar"
    ? {
        text: "text-[color:var(--efh-solar)]",
        soft: "bg-[color:var(--efh-solar)]/10",
      }
    : {
        text: "text-[color:var(--efh-grid)]",
        soft: "bg-[color:var(--efh-grid)]/10",
      };

  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex size-9 shrink-0 items-center justify-center rounded-full ${tone.soft} ${tone.text}`}
      >
        {accent === "solar" ? (
          <Sun className="size-5" />
        ) : (
          <ThunderboltFill className="size-5" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-foreground">{title}</div>
        <div className="truncate text-xs text-muted">{subtitle}</div>
      </div>
      {connected ? (
        <div className="flex items-center gap-2">
          <Chip color="success" variant="soft" size="sm">
            <CircleCheckFill className="mr-1 inline size-3 align-middle" />
            Connected
          </Chip>
          {/* Post-connect actions: disconnect (both providers) and switch
              inverter (SunSync only). The "Manage" label is the same on both
              providers so the row layout stays uniform; the dialog itself
              adapts to what that provider supports. */}
          <ManageModal>
            <Button size="sm" variant="tertiary">
              Manage
            </Button>
          </ManageModal>
        </div>
      ) : (
        <ConnectModal>
          <Button size="sm" variant="primary">
            Connect
          </Button>
        </ConnectModal>
      )}
    </div>
  );
}

export interface ProviderStatusBarProps {
  sunsync: { connected: boolean; lastSyncedAt: string | null };
  octopus: { connected: boolean; accountNumber: string | null; backfillComplete: boolean };
  /**
   * Passed through to the manage modals as a chip so a user with several
   * homes is sure they're managing the right one. `null` when nothing is
   * resolved yet (single-property, unnamed, or backend refused).
   */
  activePropertyLabel?: string | null;
}

/**
 * `Intl.DateTimeFormat` is used rather than `Date.toLocaleString` so the
 * output is stable across server / client environments — locale-based
 * fallback would drift between the SSR render and the hydration render,
 * throwing a hydration mismatch warning.
 */
function formatRelativeSync(iso: string | null): string {
  if (!iso) return "Waiting for first reading";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const mins = Math.max(0, Math.round((now - then) / 60_000));
  if (mins < 1) return "Synced just now";
  if (mins < 60) return `Synced ${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `Synced ${hrs} h ago`;
  const days = Math.round(hrs / 24);
  return `Synced ${days} d ago`;
}

export function ProviderStatusBar({
  sunsync,
  octopus,
  activePropertyLabel,
}: ProviderStatusBarProps) {
  const sunsyncSubtitle = sunsync.connected
    ? formatRelativeSync(sunsync.lastSyncedAt)
    : "Add your inverter for live power flow";

  const octopusSubtitle = octopus.connected
    ? octopus.backfillComplete
      ? octopus.accountNumber
        ? `Account ${octopus.accountNumber}`
        : "Ready"
      : "Back-filling your history…"
    : "Add your tariff for cost and consumption";

  // Currying the property label through each manage modal — done inline so
  // the two providers get identical wiring without a shared factory.
  const SunSyncManage = (p: { children: React.ReactNode }) => (
    <ManageSunSyncModal propertyLabel={activePropertyLabel ?? null}>
      {p.children}
    </ManageSunSyncModal>
  );
  const OctopusManage = (p: { children: React.ReactNode }) => (
    <ManageOctopusModal
      propertyLabel={activePropertyLabel ?? null}
      accountNumber={octopus.accountNumber}
    >
      {p.children}
    </ManageOctopusModal>
  );

  return (
    <div className="grid gap-3 rounded-xl border border-border bg-surface p-4 md:grid-cols-2">
      <ProviderRow
        accent="solar"
        title="Sunsynk"
        subtitle={sunsyncSubtitle}
        connected={sunsync.connected}
        ConnectModal={ConnectSunSyncModal}
        ManageModal={SunSyncManage}
      />
      <ProviderRow
        accent="grid"
        title="Octopus"
        subtitle={octopusSubtitle}
        connected={octopus.connected}
        ConnectModal={ConnectOctopusModal}
        ManageModal={OctopusManage}
      />
    </div>
  );
}
