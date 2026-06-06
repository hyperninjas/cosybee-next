"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  AlertDialog,
  Button,
  Card,
  Input,
  Label,
  TextField,
} from "@heroui/react";
import { authClient } from "@/app/lib/auth-client";

export function DangerZoneCard({ currentEmail }: { currentEmail: string }) {
  const router = useRouter();

  const [newEmail, setNewEmail] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailStatus, setEmailStatus] = useState<
    { kind: "ok" | "error"; message: string } | null
  >(null);

  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function changeEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEmailStatus(null);
    setEmailBusy(true);
    const { error } = await authClient.changeEmail({
      newEmail: newEmail.trim(),
      callbackURL: "/account/security",
    });
    if (error) {
      setEmailStatus({ kind: "error", message: error.message || "Could not change email." });
    } else {
      setEmailStatus({
        kind: "ok",
        message:
          "Check your inbox to confirm the change. Your email updates once verified.",
      });
      setNewEmail("");
    }
    setEmailBusy(false);
  }

  async function deleteAccount() {
    setDeleteError("");
    setDeleteBusy(true);
    const { error } = await authClient.deleteUser({ callbackURL: "/" });
    if (error) {
      setDeleteError(error.message || "Could not delete account.");
      setDeleteBusy(false);
      return;
    }
    // Either deleted immediately or a confirmation email was sent; in both
    // cases send the user home.
    router.push("/");
    router.refresh();
  }

  return (
    <Card className="border-danger/30">
      <Card.Header>
        <Card.Title>Danger zone</Card.Title>
        <Card.Description>Change your email or delete your account.</Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-8">
        {/* Change email */}
        <form onSubmit={changeEmail} className="flex max-w-md flex-col gap-3">
          <TextField
            name="newEmail"
            type="email"
            isRequired
            value={newEmail}
            onChange={setNewEmail}
          >
            <Label>Change email</Label>
            <Input placeholder={currentEmail} autoComplete="email" />
          </TextField>
          {emailStatus && (
            <Alert status={emailStatus.kind === "ok" ? "success" : "danger"}>
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>{emailStatus.message}</Alert.Title>
              </Alert.Content>
            </Alert>
          )}
          <div>
            <Button type="submit" variant="secondary" isPending={emailBusy}>
              Update email
            </Button>
          </div>
        </form>

        {/* Delete account */}
        <div className="border-t border-border pt-6">
          <p className="mb-1 text-sm font-semibold text-foreground">Delete account</p>
          <p className="mb-3 text-sm text-muted">
            Permanently remove your account and all associated data. This cannot
            be undone.
          </p>
          {deleteError && (
            <p className="mb-3 text-sm text-danger">{deleteError}</p>
          )}
          <AlertDialog>
            <Button variant="danger">Delete account</Button>
            <AlertDialog.Backdrop>
              <AlertDialog.Container>
                <AlertDialog.Dialog>
                  <AlertDialog.Header>
                    <AlertDialog.Heading>Delete your account?</AlertDialog.Heading>
                  </AlertDialog.Header>
                  <AlertDialog.Body>
                    This permanently deletes your EnergieBee account and cannot
                    be undone.
                  </AlertDialog.Body>
                  <AlertDialog.Footer>
                    <Button slot="close" variant="tertiary">
                      Cancel
                    </Button>
                    <Button
                      slot="close"
                      variant="danger"
                      isPending={deleteBusy}
                      onPress={deleteAccount}
                    >
                      Delete account
                    </Button>
                  </AlertDialog.Footer>
                </AlertDialog.Dialog>
              </AlertDialog.Container>
            </AlertDialog.Backdrop>
          </AlertDialog>
        </div>
      </Card.Content>
    </Card>
  );
}
