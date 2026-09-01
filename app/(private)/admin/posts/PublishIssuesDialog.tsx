"use client";

import { AlertDialog, Button } from "@heroui/react";
import { TriangleExclamation } from "@gravity-ui/icons";
import { IMAGE_GUIDANCE, type PostIssue } from "@/app/lib/post-issues";

/**
 * Shown when the author presses Publish/Update on a post that has issues.
 *
 * Every issue here is advisory — the dialog exists to make them visible at the
 * moment they still matter, not to stop the publish. "Publish anyway" is the
 * primary action for exactly that reason. (The one hard blocker, content
 * images with no alt text, never reaches this dialog: it disables the save
 * buttons instead.)
 */
export function PublishIssuesDialog({
  isOpen,
  onOpenChange,
  issues,
  confirmLabel,
  onConfirm,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  issues: PostIssue[];
  /** "Publish anyway" / "Update anyway", matching the button that was pressed. */
  confirmLabel: string;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <AlertDialog.Backdrop>
        <AlertDialog.Container size="lg">
          {/* `max-h-full` is what makes the dialog behave on a long list. The
              container is already viewport-height and the body already carries
              `flex-1 min-h-0 overflow-y-auto`, but with no bound on the dialog
              itself it just grows past the screen and takes the footer with
              it. Bounded, the header and footer hold their place and the
              issues scroll between them. */}
          <AlertDialog.Dialog className="max-h-full">
            <AlertDialog.CloseTrigger />
            <AlertDialog.Header>
              <AlertDialog.Icon status="warning">
                <TriangleExclamation className="size-5" />
              </AlertDialog.Icon>
              <AlertDialog.Heading>
                {issues.length === 1
                  ? "1 thing worth a look"
                  : `${issues.length} things worth a look`}
              </AlertDialog.Heading>
            </AlertDialog.Header>

            <AlertDialog.Body className="space-y-4">
              <p className="text-sm text-muted">
                None of these stop you publishing.
              </p>

              <ul className="space-y-3">
                {issues.map((issue) => (
                  <li
                    key={issue.id}
                    className="rounded-lg border border-border bg-background px-3 py-2.5"
                  >
                    <p className="text-sm font-semibold text-foreground">
                      {issue.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted">
                      {issue.detail}
                    </p>
                  </li>
                ))}
              </ul>

              {/* The targets themselves, so the numbers in the list above have
                  somewhere to point back to. */}
              <div className="rounded-lg bg-surface-secondary px-3 py-2.5">
                <p className="text-xs font-semibold text-foreground">
                  Recommended image sizes
                </p>
                <dl className="mt-1.5 space-y-1">
                  {Object.values(IMAGE_GUIDANCE).map((guide) => (
                    <div
                      key={guide.label}
                      className="flex flex-wrap items-baseline gap-x-2 text-xs"
                    >
                      <dt className="font-medium text-foreground">
                        {guide.label}
                      </dt>
                      <dd className="text-muted">
                        {guide.exact
                          ? `${guide.exact.width} × ${guide.exact.height}`
                          : `max ${guide.maxWidth}px wide`}
                        {" · under "}
                        {guide.maxBytes >= 1024 * 1024
                          ? `${guide.maxBytes / 1024 / 1024} MB`
                          : `${Math.round(guide.maxBytes / 1024)} KB`}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </AlertDialog.Body>

            <AlertDialog.Footer>
              <Button variant="tertiary" onPress={() => onOpenChange(false)}>
                Go back and fix
              </Button>
              <Button
                variant="primary"
                onPress={() => {
                  onOpenChange(false);
                  onConfirm();
                }}
              >
                {confirmLabel}
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}
