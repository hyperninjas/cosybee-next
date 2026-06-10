"use client";

import { Card, Input } from "@heroui/react";
import { Labeled } from "./Labeled";

/**
 * Schedule card — set a future `publishedAt` to delay publication. Only
 * meaningful when the eventual save status is PUBLISHED; the backend
 * gates public visibility on `publishedAt <= now`.
 */
export function ScheduleCard({
  publishedAt,
  setPublishedAt,
}: {
  publishedAt: string;
  setPublishedAt: (v: string) => void;
}) {
  return (
    <Card>
      <Card.Header>
        <Card.Title className="text-sm font-semibold">Schedule</Card.Title>
      </Card.Header>
      <Card.Content className="space-y-3">
        <Labeled
          label="Publish at"
          hint="Leave blank to publish immediately when you save. Future times = the post goes live automatically."
        >
          <Input
            variant="secondary"
            fullWidth
            type="datetime-local"
            value={publishedAt}
            onChange={(e) => setPublishedAt(e.target.value)}
          />
        </Labeled>
      </Card.Content>
    </Card>
  );
}
