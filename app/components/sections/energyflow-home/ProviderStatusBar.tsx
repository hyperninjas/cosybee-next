import { Button, Chip } from "@heroui/react";
import { CircleCheckFill, HouseFill, Sun, ThunderboltFill } from "@gravity-ui/icons";
import { ConnectSunSyncModal } from "@/app/components/sections/connect/ConnectSunSyncModal";
import { ConnectOctopusModal } from "@/app/components/sections/connect/ConnectOctopusModal";
import { ManageSunSyncModal } from "@/app/components/sections/manage/ManageSunSyncModal";
import { ManageOctopusModal } from "@/app/components/sections/manage/ManageOctopusModal";
import { ManagePropertyModal } from "@/app/components/sections/manage/ManagePropertyModal";
import { EpcRatingCard } from "@/app/components/sections/epc/EpcRatingCard";
import type { EpcRating } from "@/app/lib/epc-actions";
import type { ActiveProperty } from "@/app/lib/property-state";

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
  /**
   * Sunsynk-only tri-state: `true` = inverter is reporting fresh readings
   * (green "Connected" chip); `false` = linked but the physical inverter
   * has gone silent (amber "Connected · No live data" chip); `undefined`
   * = the provider doesn't distinguish (Octopus, which is OAuth-fetched
   * on demand and can't be "linked but silent" the same way).
   *
   * This is the fix for the silent-degradation bug: pre-2026-09, a green
   * "Connected · Synced just now" chip could sit above a flow diagram
   * that was actually rendering modelled fallback watts, because the
   * chip only checked the sync-job success and the diagram only checked
   * reading freshness — two independent signals shown as one.
   */
  liveReporting?: boolean;
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
  liveReporting,
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
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
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
        {/* Connected chip sits next to the title so the pair reads left-to-
            right as "Sunsynk · connected", instead of the earlier layout
            where the chip floated across the row with a large gap in
            between. Wraps to a second line only on very narrow widths. */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-semibold text-foreground">{title}</span>
          {connected && (
            liveReporting === false ? (
              // Linked, but the inverter isn't reporting inside the flow
              // endpoint's 20-min freshness window. Amber, not green — the
              // dashboard's diagram is showing the modelled fallback right
              // now, and pretending otherwise is what we're fixing here.
              <Chip color="warning" variant="soft" size="sm">
                <CircleCheckFill className="mr-1 inline size-3 align-middle" />
                Connected · No live data
              </Chip>
            ) : (
              <Chip color="success" variant="soft" size="sm">
                <CircleCheckFill className="mr-1 inline size-3 align-middle" />
                Connected
              </Chip>
            )
          )}
        </div>
        <div className="truncate text-xs text-muted">{subtitle}</div>
      </div>
      {connected ? (
        // Post-connect actions: disconnect (both providers) and switch
        // inverter (SunSync only). "Manage" is the same word on both
        // providers so the row layout stays uniform; the dialog itself
        // adapts to what that provider supports.
        <ManageModal>
          <Button size="sm" variant="tertiary">
            Manage
          </Button>
        </ManageModal>
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

/**
 * The Property tile leads the row so the customer sees WHICH home the
 * cards below refer to before anything else — the provider tiles, the
 * flow diagram, the cost card and the history strip are all scoped to
 * the active property, and displaying them without naming it first is
 * how "why is my dashboard showing the wrong house?" support tickets
 * happen. Positioned first for that reason, per 2026-09-21 design pass.
 *
 * The Manage button opens {@link ManagePropertyModal}, which handles
 * both editing this home (rename / re-address) AND — when the account
 * has more than one — switching the active home. Two responsibilities
 * in one dialog because the tile only affords one trigger.
 */
function PropertyRow({
  active,
  properties,
}: {
  active: ActiveProperty;
  properties: ActiveProperty[];
}) {
  // Truncated single-line preview. The full address (and postcode) stays
  // available inside the Manage modal for anyone who needs to see it in full.
  const subtitle = active.address?.trim() || active.postcode || "No address on file";

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-default-100 text-default-600"
      >
        <HouseFill className="size-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-semibold text-foreground">
            {active.label || "Property"}
          </span>
          {properties.length > 1 && (
            <Chip color="default" variant="soft" size="sm">
              {properties.length} homes
            </Chip>
          )}
        </div>
        <div className="truncate text-xs text-muted">{subtitle}</div>
      </div>
      <ManagePropertyModal active={active} properties={properties}>
        <Button size="sm" variant="tertiary">
          Manage
        </Button>
      </ManagePropertyModal>
    </div>
  );
}

export interface ProviderStatusBarProps {
  sunsync: {
    connected: boolean;
    lastSyncedAt: string | null;
    liveReporting: boolean;
    latestReadingAt: string | null;
  };
  octopus: { connected: boolean; accountNumber: string | null; backfillComplete: boolean };
  /**
   * Passed through to the manage modals as a chip so a user with several
   * homes is sure they're managing the right one. `null` when nothing is
   * resolved yet (single-property, unnamed, or backend refused).
   */
  activePropertyLabel?: string | null;
  /**
   * The home currently pinned to this session. When present, renders the
   * Property tile as the first column of the row. Omitting it (or passing
   * `null`) drops the tile entirely — a Tier-0 defensive default; in
   * practice this component only mounts after a provider is linked, which
   * requires an active property upstream.
   */
  activeProperty?: ActiveProperty | null;
  /**
   * Every non-archived home on the account. Powers the "Switch home" list
   * inside the Manage-property dialog. Passing a single-element list (or
   * one containing only the active home) collapses that section — the tile
   * still renders with just the edit form.
   */
  properties?: ActiveProperty[];
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
  epc,
  activePropertyLabel,
  activeProperty,
  properties,
}: ProviderStatusBarProps & { epc?: EpcRating }) {
  // When the inverter is reporting fresh, "Synced X min ago" against the
  // reading timestamp is the honest signal (falls back to the sync-job
  // timestamp for old backends that don't send latestReadingAt yet).
  //
  // When it's linked but silent, sync-job success is not what the user
  // needs to see — they need to know their inverter went dark and roughly
  // when. `formatRelativeSync` returns "Synced …" phrasing so we strip
  // the prefix before re-labelling it "Inverter last reported …".
  const sunsyncSubtitle = sunsync.connected
    ? sunsync.liveReporting
      ? formatRelativeSync(sunsync.latestReadingAt ?? sunsync.lastSyncedAt)
      : sunsync.latestReadingAt
        ? `Inverter last reported ${formatRelativeSync(sunsync.latestReadingAt).replace(/^Synced /, "")}`
        : "Waiting for first reading"
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

  // Each provider now sits in its OWN bordered card side-by-side instead of
  // sharing one container. Reads as two independent status tiles — the
  // Sunsynk block and the Octopus block are unrelated concerns (one drives
  // the flow diagram, the other drives cost), and a shared border was
  // grouping them by chance of layout rather than by meaning.
  // The rating sits between the two providers rather than after them: the
  // inverter tile is about power, the Octopus tile about cost, and the
  // home's own efficiency is what connects the two.
  //
  // The Property tile leads the row (added 2026-09-21). It only mounts
  // when `activeProperty` is present; a Tier-0 render without a home
  // falls back to the earlier three-column layout so nothing shifts for
  // that path.
  const showProperty = activeProperty !== null && activeProperty !== undefined;
  // Column count grows with the number of tiles actually rendered. The
  // earlier layout was `EPC ? 3 : 2`; now it's `(EPC ? 3 : 2) + property`
  // — spelled out because Tailwind cannot resolve string interpolation
  // for column counts and each combination has to appear as a literal
  // class name in source.
  const gridColsClass = showProperty
    ? epc
      ? "md:grid-cols-4"
      : "md:grid-cols-3"
    : epc
      ? "md:grid-cols-3"
      : "md:grid-cols-2";
  return (
    <div className={`grid gap-3 ${gridColsClass}`}>
      {showProperty && (
        <PropertyRow active={activeProperty} properties={properties ?? [activeProperty]} />
      )}
      <ProviderRow
        accent="solar"
        title="Sunsynk"
        subtitle={sunsyncSubtitle}
        connected={sunsync.connected}
        liveReporting={sunsync.liveReporting}
        ConnectModal={ConnectSunSyncModal}
        ManageModal={SunSyncManage}
      />
      {epc && <EpcRatingCard rating={epc} />}
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
