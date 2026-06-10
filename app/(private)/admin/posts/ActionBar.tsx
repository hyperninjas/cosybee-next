"use client";

import {
  Button,
  Card,
  Chip,
  ListBox,
  ListBoxItem,
  Select,
} from "@heroui/react";
import { ArrowUpRightFromSquare } from "@gravity-ui/icons";
import { useFormStatus } from "react-dom";
import { AppLink } from "@/app/components/ui/AppLink";

export type PostStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

/** Sticky top action bar — blog picker on the left, status chip + action
 *  buttons on the right. Drives its busy state from the surrounding
 *  <form>'s useFormStatus. */
export function ActionBar({
  editing,
  status,
  blog,
  setBlog,
  onSetStatus,
  liveHref,
  disabled = false,
}: {
  editing: boolean;
  status: PostStatus;
  blog: string;
  setBlog: (b: string) => void;
  onSetStatus: (s: string) => void;
  liveHref?: string;
  /** Block both save buttons (e.g. content images missing alt text). */
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  const isPublished = status === "PUBLISHED";
  const isArchived = status === "ARCHIVED";
  const chipColor = isPublished
    ? ("success" as const)
    : isArchived
      ? ("warning" as const)
      : ("default" as const);
  const chipLabel = isPublished
    ? "Published"
    : isArchived
      ? "Archived"
      : "Draft";
  return (
    <Card className="sticky top-20 z-30 mb-6 flex-row items-center justify-between">
      <div className="flex items-center gap-3">
        <Select
          aria-label="Blog"
          selectedKey={blog}
          onSelectionChange={(k) => setBlog(String(k))}
        >
          <Select.Trigger className="w-28">
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBoxItem id="hive">Hive</ListBoxItem>
              <ListBoxItem id="learn">Learn</ListBoxItem>
            </ListBox>
          </Select.Popover>
        </Select>
        <Chip
          color={chipColor}
          size="sm"
          variant="soft"
          className="hidden sm:inline-flex"
        >
          {chipLabel}
        </Chip>
      </div>

      <div className="flex items-center gap-2">
        {liveHref && (
          <AppLink
            href={liveHref}
            external
            className="hidden items-center gap-1 text-sm text-muted transition-colors hover:text-foreground sm:inline-flex"
          >
            View live
            <ArrowUpRightFromSquare className="size-3.5" />
          </AppLink>
        )}
        <Button
          type="submit"
          variant="outline"
          size="sm"
          onPress={() => onSetStatus("DRAFT")}
          isDisabled={pending || disabled}
          isPending={pending && status === "DRAFT"}
        >
          Save draft
        </Button>
        {editing && (isPublished || isArchived) && (
          <Button
            type="submit"
            variant="outline"
            size="sm"
            onPress={() => onSetStatus(isArchived ? "DRAFT" : "ARCHIVED")}
            isDisabled={pending || disabled}
            isPending={pending && status === "ARCHIVED"}
          >
            {isArchived ? "Unarchive" : "Archive"}
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          size="sm"
          onPress={() => onSetStatus("PUBLISHED")}
          isDisabled={pending || disabled}
          isPending={pending && status === "PUBLISHED"}
        >
          {editing && isPublished ? "Update" : "Publish"}
        </Button>
      </div>
    </Card>
  );
}
