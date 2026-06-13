"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRightFromSquare,
  Eye,
  EyeSlash,
  TrashBin,
} from "@gravity-ui/icons";
import { Button, Chip, Modal, Tooltip } from "@heroui/react";
import { AppImage as Image } from "@/app/components/ui/AppImage";
import { isExternalUrl } from "@/app/lib/article-types";
import { type Row } from "./PostsTable";

/** http(s) URL → as-is; `/images/*` (legacy seed) → placeholder;
 *  empty → placeholder; everything else → as-is. */
function coverSrc(coverImage: string): string {
  if (!coverImage || coverImage.startsWith("/images/"))
    return "/bee-flower.png";
  return coverImage;
}

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
export function PostCard({
  row,
  onToggle,
  onDelete,
}: {
  row: Row;
  onToggle: (row: Row) => void;
  onDelete: (row: Row) => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isPublished = row.status === "PUBLISHED";
  const imageUrl = coverSrc(row.coverImage);

  const statusPillClass = `absolute left-3 top-3 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium shadow-sm ring-1 ring-black/10 backdrop-blur ${
    isPublished
      ? "bg-success/70 text-success-foreground"
      : "bg-surface/95 text-foreground"
  }`;

  return (
    <>
      <article
        title={row.title}
        className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-[0px_1px_3px_0px_rgba(0,0,0,0.08)] transition duration-300 hover:border-accent/30 hover:shadow-lg"
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

          {row.featured && (
            <span
              aria-label="Featured"
              title="Featured"
              className="absolute right-3 top-3 inline-flex size-6 items-center justify-center rounded-full bg-surface/95 text-sm text-warning shadow-sm ring-1 ring-black/10 backdrop-blur"
            >
              ★
            </span>
          )}
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
            {/* next/link isn't React-Aria-focusable; wrap it so the
                surrounding TooltipTrigger picks up its hover/focus. The
                wrapper needs a real box (not `display:contents`) so the
                popover has something to anchor to. */}
            <Tooltip.Trigger className="mt-3 block">
              <Link
                href={`/admin/posts/${row.id}/edit`}
                className="line-clamp-2 text-base font-semibold leading-snug text-foreground transition-colors hover:text-accent"
              >
                {row.title}
              </Link>
            </Tooltip.Trigger>
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
    </>
  );
}
