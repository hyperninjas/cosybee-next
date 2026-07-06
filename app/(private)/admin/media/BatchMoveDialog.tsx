"use client";

import { useState } from "react";
import {
  Alert,
  AlertDialog,
  Button,
  ListBox,
  Select,
} from "@heroui/react";
import type { MediaFolder } from "@/app/lib/storage";

/** Sentinel for the "no folder" (root/unfiled) option. */
const UNFILED = "__unfiled__";

/**
 * Move a batch of selected media into a folder (or Unfiled). Mirrors the folder
 * picker in the detail modal, but applies the choice to many files at once via
 * the caller's `onMove`. Non-destructive, so no danger styling.
 */
export function BatchMoveDialog({
  isOpen,
  onOpenChange,
  folders,
  count,
  onMove,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  folders: MediaFolder[];
  count: number;
  onMove: (folderId: string | null) => Promise<void>;
}) {
  const [folderId, setFolderId] = useState<string>(UNFILED);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset the picker on close so the next open never shows a stale choice —
  // done in the handler (not an effect) to avoid cascading renders.
  function handleOpenChange(open: boolean) {
    if (!open) {
      setFolderId(UNFILED);
      setError(null);
    }
    onOpenChange(open);
  }

  async function handleMove() {
    setPending(true);
    setError(null);
    try {
      await onMove(folderId === UNFILED ? null : folderId);
      handleOpenChange(false);
    } catch (e) {
      setError((e as Error).message || "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog isOpen={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialog.Backdrop>
        <AlertDialog.Container>
          <AlertDialog.Dialog>
            <AlertDialog.Header>
              <AlertDialog.Heading>
                Move {count} file{count === 1 ? "" : "s"}
              </AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body className="space-y-3">
              <p className="text-sm text-muted">
                Choose the folder to move the selected file
                {count === 1 ? "" : "s"} into.
              </p>
              <Select
                aria-label="Destination folder"
                variant="secondary"
                className="w-full"
                selectedKey={folderId}
                onSelectionChange={(k) => setFolderId(String(k))}
                isDisabled={pending}
              >
                <Select.Trigger className="w-full">
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id={UNFILED} textValue="Unfiled">
                      Unfiled
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    {folders.map((f) => (
                      <ListBox.Item key={f.id} id={f.id} textValue={f.name}>
                        {f.name}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
              {error && (
                <Alert status="danger">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Description>{error}</Alert.Description>
                  </Alert.Content>
                </Alert>
              )}
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button
                variant="tertiary"
                onPress={() => handleOpenChange(false)}
                isDisabled={pending}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onPress={handleMove}
                isDisabled={pending}
                isPending={pending}
              >
                Move
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}
