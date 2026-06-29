"use client";

import { Card, Switch } from "@heroui/react";

/**
 * Home-featured card — a single Switch that flags the post for the dedicated
 * "featured articles" section on the home page. Independent of the carousel
 * `featured` flag (see {@link FeaturedCarouselCard}).
 */
export function HomeFeaturedCard({
  homeFeatured,
  setHomeFeatured,
}: {
  homeFeatured: boolean;
  setHomeFeatured: (v: boolean) => void;
}) {
  return (
    <Card className="gap-0">
      <Card.Header>
        <Switch
          isSelected={homeFeatured}
          className="justify-between"
          onChange={setHomeFeatured}
        >
          <Switch.Content>
            <span className="block text-sm font-semibold text-foreground">
              Feature on home page
            </span>
            <span className="block text-xs text-muted">
              Show this post in the home page featured section
            </span>
          </Switch.Content>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch>
      </Card.Header>
    </Card>
  );
}
