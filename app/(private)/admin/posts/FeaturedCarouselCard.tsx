"use client";

import { Card, Switch, TextArea } from "@heroui/react";
import { Labeled } from "./Labeled";

/**
 * Featured/Carousel card — header-mounted Switch toggles the post into
 * the featured carousel, body collapses with a grid-row animation when
 * off so the user gets the structural cue without dead space.
 */
export function FeaturedCarouselCard({
  featured,
  setFeatured,
  carouselIntro,
  setCarouselIntro,
  carouselBody,
  setCarouselBody,
}: {
  featured: boolean;
  setFeatured: (v: boolean) => void;
  carouselIntro: string;
  setCarouselIntro: (v: string) => void;
  carouselBody: string;
  setCarouselBody: (v: string) => void;
}) {
  return (
    <Card className="gap-0">
      <Card.Header>
        <Switch
          isSelected={featured}
          className="justify-between"
          onChange={setFeatured}
        >
          <Switch.Content>
            <span className="block text-sm font-semibold text-foreground">
              Feature in carousel
            </span>
            <span className="block text-xs text-muted">
              Show this post in the featured carousel
            </span>
          </Switch.Content>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch>
      </Card.Header>
      <div
        aria-hidden={!featured}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
          featured
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0 pointer-events-none"
        }`}
      >
        <div className="overflow-hidden">
          <Card.Content className="space-y-3 mt-4">
            <Labeled
              label="Carousel intro"
              hint="Auto-filled from lede/excerpt if blank."
            >
              <TextArea
                variant="secondary"
                fullWidth
                value={carouselIntro}
                onChange={(e) => setCarouselIntro(e.target.value)}
                rows={2}
              />
            </Labeled>
            <Labeled
              label="Carousel body"
              hint="Auto-filled from the excerpt if blank."
            >
              <TextArea
                variant="secondary"
                fullWidth
                value={carouselBody}
                onChange={(e) => setCarouselBody(e.target.value)}
                rows={3}
              />
            </Labeled>
          </Card.Content>
        </div>
      </div>
    </Card>
  );
}
