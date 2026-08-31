import { Button, ButtonGroup, Chip } from "@heroui/react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sun,
} from "@gravity-ui/icons";
import type { DashboardData } from "./types";
import { PropertySwitcher } from "./PropertySwitcher";
import type { ActiveProperty } from "@/app/lib/property-state";

/**
 * Top strip of the dashboard: page title, optional achievement chip,
 * property switcher (multi-property only — a passive chip for single-
 * property users), and the date navigator.
 *
 * `properties` / `activePropertyId` are optional so the demo path
 * (`?demo=1`) can render the header without a real property list —
 * PropertySwitcher self-hides when the array is empty. The nav is a
 * HeroUI {@link ButtonGroup} so its segmented look and focus ring come
 * from the design system rather than ad-hoc classes. The two chevron
 * buttons are visual-only in this first pass — they become interactive
 * when the parent gains a client component for day switching.
 */

export function DashboardHeader({
  achievement,
  dayLabel,
  properties = [],
  activePropertyId = null,
}: {
  achievement: DashboardData["achievement"];
  dayLabel: string;
  properties?: ActiveProperty[];
  activePropertyId?: string | null;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Energy Dashboard
        </h1>
        {achievement && (
          <Chip color="warning" variant="soft" size="md">
            <Sun className="mr-1 inline size-4 align-middle" />
            <span className="font-semibold">{achievement.title}</span>
            <span className="ml-2 text-muted">{achievement.message}</span>
          </Chip>
        )}
        <PropertySwitcher properties={properties} activeId={activePropertyId} />
      </div>

      <ButtonGroup size="sm" variant="tertiary">
        <Button isIconOnly aria-label="Previous day">
          <ChevronLeft className="size-4" />
        </Button>
        <Button>
          <Calendar className="mr-1.5 size-4" />
          {dayLabel}
        </Button>
        <Button isIconOnly aria-label="Next day">
          <ChevronRight className="size-4" />
        </Button>
      </ButtonGroup>
    </div>
  );
}
