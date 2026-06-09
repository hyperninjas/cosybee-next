"use client";

import { useState } from "react";
import { ListBox, Select, Spinner } from "@heroui/react";
import type { Key } from "@heroui/react";
import type { Role } from "./types";

/**
 * Inline role picker for a single user row. Owns its own pending state so the
 * row shows a spinner while the change is in flight without blocking the rest
 * of the table.
 */
export function RoleSelect({
  userName,
  role,
  onChange,
}: {
  userName: string;
  role: Role;
  onChange: (role: Role) => Promise<void>;
}) {
  const [pending, setPending] = useState(false);

  async function handleChange(value: Key | null) {
    const next = value as Role;
    if (!next || next === role) return;
    setPending(true);
    try {
      await onChange(next);
    } catch {
      // Errors surface as toasts from the parent; keep the prior value.
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        aria-label={`Role for ${userName}`}
        className="w-[120px]"
        isDisabled={pending}
        value={role}
        onChange={handleChange}
      >
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            <ListBox.Item id="user" textValue="User">
              User
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="admin" textValue="Admin">
              Admin
              <ListBox.ItemIndicator />
            </ListBox.Item>
          </ListBox>
        </Select.Popover>
      </Select>
      {pending && <Spinner size="sm" />}
    </div>
  );
}
