"use client";

import { useState } from "react";
import {
  Alert,
  Button,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  TextField,
} from "@heroui/react";
import type { Key } from "@heroui/react";
import { PasswordField } from "@/app/components/ui/PasswordField";
import type { Role } from "./types";

const EMPTY = { name: "", email: "", password: "", role: "admin" as Role };

/**
 * Controlled create-admin modal. The parent owns the open state so it can
 * close on success and refresh the list. `onCreate` resolves on success and
 * rejects (with a message) on failure, which we render inline as an Alert.
 */
export function CreateUserModal({
  isOpen,
  onOpenChange,
  onCreate,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: {
    name: string;
    email: string;
    password: string;
    role: Role;
  }) => Promise<void>;
}) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Reset transient state whenever the modal is opened or dismissed.
  function handleOpenChange(open: boolean) {
    if (!open) {
      setForm(EMPTY);
      setError("");
    }
    onOpenChange(open);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onCreate(form);
      // Success: clear and let the parent close the modal.
      setForm(EMPTY);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal.Backdrop
      variant="blur"
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
    >
      <Modal.Container size="sm">
        <Modal.Dialog>
          <Modal.CloseTrigger />
          <form onSubmit={handleSubmit}>
            <Modal.Header>
              <Modal.Heading>Create admin user</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4">
              <TextField
                isRequired
                name="name"
                value={form.name}
                onChange={(v) => set("name", v)}
              >
                <Label>Name</Label>
                <Input variant="secondary" placeholder="Full name" />
              </TextField>

              <TextField
                isRequired
                name="email"
                type="email"
                value={form.email}
                onChange={(v) => set("email", v)}
              >
                <Label>Email</Label>
                <Input variant="secondary" placeholder="admin@example.com" />
              </TextField>

              <PasswordField
                name="password"
                label="Password"
                placeholder="Min 8 characters"
                autoComplete="new-password"
                isRequired
                minLength={8}
                value={form.password}
                onChange={(v) => set("password", v)}
              />

              <Select
                aria-label="Role"
                variant="secondary"
                value={form.role}
                onChange={(value: Key | null) =>
                  set("role", (value as Role) || "admin")
                }
              >
                <Label>Role</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="admin" textValue="Admin">
                      Admin
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    <ListBox.Item id="user" textValue="User">
                      User
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
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
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="tertiary" isDisabled={loading}>
                Cancel
              </Button>
              <Button type="submit" isPending={loading}>
                Create user
              </Button>
            </Modal.Footer>
          </form>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
