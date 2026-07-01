"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRightFromSquare,
  Eye,
  EyeSlash,
  House,
  HouseFill,
  Star,
  StarFill,
  TrashBin,
} from "@gravity-ui/icons";
import { Button, Card, Chip, Modal, Tooltip } from "@heroui/react";
import { Focusable } from "react-aria-components";
import { AppImage as Image } from "@/app/components/ui/AppImage";
import { isExternalUrl, resolveCoverImage } from "@/app/lib/article-types";
import { type Row } from "./PostsTable";

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const m = Math.round((Date.now() - then) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Distinct chip colour per blog so the two streams are visually separable
 *  at a glance. New blogs fall back to default. */
const BLOG_CHIP_COLOR: Record<
  string,
  "accent" | "success" | "warning" | "default"
> = {
  hive: "warning",
  learn: "success",
};

/**
 * Admin variant of the public-blog `ArticleCard`. Cover up top, meta + title
 * + footer below, plus three inline action buttons (Preview / Publish-toggle
 * / Delete) instead of the table view's three-dot menu.
 */
/** Circular cover toggle that doubles as a status indicator (filled when on,
 *  outline when off). Click flips the flag via the supplied handler. */
function CoverToggle({
  active,
  label,
  ActiveIcon,
  InactiveIcon,
  onPress,
}: {
  active: boolean;
  label: string;
  ActiveIcon: React.ComponentType<{ className?: string }>;
  InactiveIcon: React.ComponentType<{ className?: string }>;
  onPress: () => void;
}) {
  return (
    <Tooltip delay={300}>
      <Button
        isIconOnly
        variant="ghost"
        aria-label={label}
        aria-pressed={active}
        onPress={onPress}
        className={`size-7 min-h-0 min-w-0 rounded-full p-0 shadow-sm ring-1 ring-black/10 backdrop-blur transition-colors ${
          active
            ? "bg-warning text-white hover:bg-warning/90"
            : "bg-surface/95 text-muted hover:bg-surface hover:text-foreground"
        }`}
      >
        {active ? (
          <ActiveIcon className="size-3.5" />
        ) : (
          <InactiveIcon className="size-3.5" />
        )}
      </Button>
      <Tooltip.Content>{label}</Tooltip.Content>
    </Tooltip>
  );
}

export function PostCard({
  row,
  onToggle,
  onToggleFeatured,
  onToggleHomeFeatured,
  onDelete,
}: {
  row: Row;
  onToggle: (row: Row) => void;
  onToggleFeatured: (row: Row) => void;
  onToggleHomeFeatured: (row: Row) => void;
  onDelete: (row: Row) => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isPublished = row.status === "PUBLISHED";
  const imageUrl = resolveCoverImage(row.coverImage, row.ogImage);

  const statusPillClass = `absolute left-3 top-3 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium shadow-sm ring-1 ring-black/10 backdrop-blur ${
    isPublished
      ? "bg-success/70 text-success-foreground"
      : "bg-surface/95 text-foreground"
  }`;

  return (
    <Card className="h-full p-0 overflow-hidden border border-border shadow-[0px_1px_3px_0px_rgba(0,0,0,0.08)] hover:shadow-lg transition duration-300">
      <article
        title={row.title}
        className="group flex h-full flex-col overflow-hidden bg-surface"
      >
        <div className="relative h-40 bg-default">
          <Image
            src={imageUrl}
            alt={`${row.title} banner image`}
            fill
            sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-103 motion-reduce:transform-none motion-reduce:transition-none"
            unoptimized={isExternalUrl(imageUrl)}
          />

          <span className={statusPillClass}>
            {isPublished ? "Published" : "Draft"}
          </span>

          <div className="absolute right-3 top-3 flex items-center gap-1.5">
            <CoverToggle
              active={row.homeFeatured}
              label={
                row.homeFeatured
                  ? "Featured on home page — click to remove"
                  : "Feature on home page"
              }
              ActiveIcon={HouseFill}
              InactiveIcon={House}
              onPress={() => onToggleHomeFeatured(row)}
            />
            <CoverToggle
              active={row.featured}
              label={
                row.featured
                  ? "Featured in carousel — click to remove"
                  : "Feature in carousel"
              }
              ActiveIcon={StarFill}
              InactiveIcon={Star}
              onPress={() => onToggleFeatured(row)}
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <Chip
              size="sm"
              variant="soft"
              color={BLOG_CHIP_COLOR[row.blog] ?? "default"}
              className="capitalize"
            >
              {row.blog}
            </Chip>
            <span>·</span>
            <span className="truncate">
              {row.category?.name ?? "Uncategorised"}
            </span>
          </div>

          <Tooltip delay={300}>
            {/* next/link isn't React-Aria-focusable on its own. `Focusable`
                forwards the tooltip trigger's focus/hover onto the <a> itself
                (it renders no DOM of its own), so the link is a SINGLE tab
                stop — wrapping it in `Tooltip.Trigger` instead added a second
                focusable element, double-focusing on keyboard nav. */}
            <Focusable>
              <Link
                href={`/admin/posts/${row.id}/edit`}
                className="mt-3 line-clamp-2 text-base font-semibold leading-snug text-foreground transition-colors hover:text-accent"
              >
                {row.title}
              </Link>
            </Focusable>
            <Tooltip.Content>Click to edit</Tooltip.Content>
          </Tooltip>

          <p className="mt-1 truncate font-mono text-xs text-muted">
            /{row.blog}/{row.slug}
          </p>

          <div className="mt-auto flex items-center justify-between gap-2 pt-4">
            <span className="truncate text-xs text-muted">
              {relativeTime(row.updatedAt)}
            </span>
            <div className="flex items-center gap-1">
              <Tooltip delay={300}>
                <Button
                  variant="ghost"
                  size="sm"
                  isIconOnly
                  aria-label="Open preview in new tab"
                  onPress={() =>
                    window.open(
                      `/admin/posts/${row.id}/preview`,
                      "_blank",
                      "noopener,noreferrer",
                    )
                  }
                >
                  <ArrowUpRightFromSquare className="size-4" />
                </Button>
                <Tooltip.Content>Preview</Tooltip.Content>
              </Tooltip>
              <Tooltip delay={300}>
                <Button
                  variant="ghost"
                  size="sm"
                  isIconOnly
                  aria-label={isPublished ? "Unpublish" : "Publish"}
                  onPress={() => onToggle(row)}
                >
                  {isPublished ? (
                    <EyeSlash className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </Button>
                <Tooltip.Content>
                  {isPublished ? "Unpublish" : "Publish"}
                </Tooltip.Content>
              </Tooltip>
              <Tooltip delay={300}>
                <Button
                  variant="ghost"
                  size="sm"
                  isIconOnly
                  aria-label="Delete"
                  onPress={() => setConfirmOpen(true)}
                  className="text-danger hover:text-danger"
                >
                  <TrashBin className="size-4" />
                </Button>
                <Tooltip.Content>Delete</Tooltip.Content>
              </Tooltip>
            </div>
          </div>
        </div>
      </article>

      <Modal.Backdrop
        variant="blur"
        isOpen={confirmOpen}
        onOpenChange={setConfirmOpen}
      >
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Delete this post?</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p className="text-sm text-muted">
                <span className="font-medium text-foreground">{row.title}</span>{" "}
                (/{row.blog}/{row.slug}) will be permanently deleted. This
                can&apos;t be undone.
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="tertiary">
                Cancel
              </Button>
              <Button
                variant="danger"
                onPress={() => {
                  onDelete(row);
                  setConfirmOpen(false);
                }}
              >
                Delete post
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Card>
  );
}
