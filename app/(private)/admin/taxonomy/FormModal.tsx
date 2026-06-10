"use client";

import { type ReactNode } from "react";
import { Modal } from "@heroui/react";

/**
 * Reusable HeroUI Modal shell for the admin taxonomy (authors / categories /
 * tags) create + edit forms. Kept generic so any future "edit a thing in a
 * dialog" surface can drop it in.
 *
 * Usage:
 *
 *   const overlay = useOverlayState();
 *   <FormModal
 *     isOpen={overlay.isOpen}
 *     onOpenChange={overlay.setOpen}
 *     title="New author"
 *   >
 *     <AuthorForm onSaved={overlay.close} />
 *   </FormModal>
 */
export function FormModal({
  isOpen,
  onOpenChange,
  title,
  description,
  size = "lg",
  children,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  size?: "xs" | "sm" | "md" | "lg" | "full" | "cover";
  children: ReactNode;
}) {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container size={size} scroll="inside">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading className="text-lg font-extrabold text-foreground">
                {title}
              </Modal.Heading>
              {description && (
                <p className="mt-1 text-sm text-muted">{description}</p>
              )}
            </Modal.Header>
            <Modal.Body className="max-h-[70vh] overflow-y-auto">
              {children}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
