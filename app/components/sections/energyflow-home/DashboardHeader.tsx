import { Button, ButtonGroup, Chip } from "@heroui/react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sun,
} from "@gravity-ui/icons";
import type { DashboardData } from "./types";

/**
 * Top strip of the dashboard: page title, an optional achievement chip, and
 * the date navigator. The nav is a HeroUI {@link ButtonGroup} so its
 * segmented look and focus ring come from the design system rather than
 * ad-hoc classes. The two chevron buttons are visual-only in this first
 * pass — they become interactive when the parent gains a client component
 * for day switching.
 */

export function DashboardHeader({
  achievement,
  dayLabel,
}: {
  achievement: DashboardData["achievement"];
  dayLabel: string;
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
