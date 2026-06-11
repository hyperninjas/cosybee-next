"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EllipsisVertical } from "@gravity-ui/icons";
import {
  Button,
  buttonVariants,
  Dropdown,
  Label,
  Modal,
  Separator,
} from "@heroui/react";
import { type Row } from "./PostsTable";

/**
 * Row actions as a single three-dot menu — keeps the actions column (and
 * each card's footer) compact and consistent. Edit/Preview navigate;
 * Publish toggles optimistically; Delete opens a confirm modal so the
 * destructive action is intentional.
 *
 * Used by both `PostsTable` (table view) and `PostCard` (card view).
 */
export function RowActions({
  row,
  onToggle,
  onDelete,
}: {
  row: Row;
  onToggle: (row: Row) => void;
  onDelete: (row: Row) => void;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isPublished = row.status === "PUBLISHED";

  function onAction(key: string) {
    switch (key) {
      case "edit":
        router.push(`/admin/posts/${row.id}/edit`);
        break;
      case "preview":
        window.open(
          `/admin/posts/${row.id}/preview`,
          "_blank",
          "noopener,noreferrer",
        );
        break;
      case "toggle":
        onToggle(row);
        break;
      case "delete":
        setConfirmOpen(true);
        break;
    }
  }

  return (
    <>
      <Dropdown>
        <Dropdown.Trigger
          aria-label="Post actions"
          // Dropdown.Trigger IS the <button> (a nested <Button> would be
          // button-in-button). Its `.dropdown__trigger` class is
          // `inline-block`, which overrides the button's flex centering —
          // so re-assert inline-flex centering via utilities (utilities
          // beat the component layer).
          className={`${buttonVariants({
            variant: "ghost",
            size: "sm",
            isIconOnly: true,
          })} inline-flex items-center justify-center`}
        >
          <EllipsisVertical className="size-4" />
        </Dropdown.Trigger>
        <Dropdown.Popover className="min-w-40">
          <Dropdown.Menu onAction={(key) => onAction(String(key))}>
            <Dropdown.Item id="edit" textValue="Edit">
              <Label>Edit</Label>
            </Dropdown.Item>
            <Dropdown.Item id="preview" textValue="Preview">
              <Label>Preview</Label>
            </Dropdown.Item>
            <Dropdown.Item
              id="toggle"
              textValue={isPublished ? "Unpublish" : "Publish"}
            >
              <Label>{isPublished ? "Unpublish" : "Publish"}</Label>
            </Dropdown.Item>
            <Separator />
            <Dropdown.Item id="delete" textValue="Delete" variant="danger">
              <Label>Delete</Label>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>

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
