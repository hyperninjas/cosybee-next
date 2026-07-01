"use client";

import { Card, Input, Radio, RadioGroup, Switch } from "@heroui/react";
import { Labeled } from "./Labeled";

/**
 * Call to Action card — Switch in the header enables the end-of-article
 * button, body holds label + radio toggle for internal/external link +
 * a URL input that swaps shape based on the radio.
 */
export function CtaCard({
  ctaEnabled,
  setCtaEnabled,
  ctaLabel,
  setCtaLabel,
  ctaHref,
  setCtaHref,
  ctaExternal,
  setCtaExternal,
  internalRoutes,
}: {
  ctaEnabled: boolean;
  setCtaEnabled: (v: boolean) => void;
  ctaLabel: string;
  setCtaLabel: (v: string) => void;
  ctaHref: string;
  setCtaHref: (v: string) => void;
  ctaExternal: boolean;
  setCtaExternal: (v: boolean) => void;
  internalRoutes: string[];
}) {
  return (
    <Card className="gap-0">
      <Card.Header>
        <Switch
          isSelected={ctaEnabled}
          className="justify-between"
          onChange={setCtaEnabled}
        >
          <Switch.Content>
            <span className="block text-sm font-semibold text-foreground">
              Show a call to action
            </span>
            <span className="block text-xs text-muted">
              Adds a button at the end of the article
            </span>
          </Switch.Content>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch>
      </Card.Header>
      <div
        aria-hidden={!ctaEnabled}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
          ctaEnabled
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0 pointer-events-none"
        }`}
      >
        <div className="overflow-hidden">
          <Card.Content className="space-y-3 mt-4">
            <Labeled label="Button label" hint="Shown on the button.">
              <Input
                variant="secondary"
                fullWidth
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                placeholder="Try EnergieBee for free"
              />
            </Labeled>

            {/* internal / external toggle */}
            <RadioGroup
              aria-label="CTA link type"
              variant="secondary"
              value={ctaExternal ? "external" : "internal"}
              onChange={(v) => setCtaExternal(v === "external")}
              className="flex flex-row gap-4"
            >
              <Radio value="internal">
                <Radio.Control>
                  <Radio.Indicator />
                </Radio.Control>
                <Radio.Content>Internal page</Radio.Content>
              </Radio>
              <Radio value="external">
                <Radio.Control>
                  <Radio.Indicator />
                </Radio.Control>
                <Radio.Content>External link</Radio.Content>
              </Radio>
            </RadioGroup>

            {ctaExternal ? (
              <Labeled
                label="External URL"
                hint="Opens in a new tab. https:// is added if you omit it."
              >
                <Input
                  variant="secondary"
                  fullWidth
                  type="url"
                  value={ctaHref}
                  onChange={(e) => setCtaHref(e.target.value)}
                  placeholder="https://example.com"
                />
              </Labeled>
            ) : (
              <Labeled
                label="Internal page"
                hint="Search an existing page. Opens in the same tab."
              >
                <Input
                  variant="secondary"
                  fullWidth
                  className="font-mono"
                  value={ctaHref}
                  onChange={(e) => setCtaHref(e.target.value)}
                  placeholder="/start"
                  list="route-options"
                />
                <datalist id="route-options">
                  {internalRoutes.map((r) => (
                    <option key={r} value={r} />
                  ))}
                </datalist>
              </Labeled>
            )}
          </Card.Content>
        </div>
      </div>
    </Card>
  );
}
