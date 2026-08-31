/**
 * Shared step header for the onboarding funnel.
 *
 * Renders "Step N of TOTAL" text above a filled progress bar. Both values
 * are explicit so a step can be rearranged / inserted / removed without
 * changing this component — the source of truth for step numbering is the
 * page that instantiates it. That's deliberately different from mobile's
 * "detect current route → look up step index" pattern, which turned into
 * an if-ladder every time a step moved.
 */

interface Props {
  step: number;
  total: number;
  title: string;
  description?: string;
}

export function OnboardingProgress({ step, total, title, description }: Props) {
  const pct = Math.max(0, Math.min(100, (step / total) * 100));
  return (
    <div className="mb-8 flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs text-muted">
        <span>
          Step {step} of {total}
        </span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-secondary">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
    </div>
  );
}
