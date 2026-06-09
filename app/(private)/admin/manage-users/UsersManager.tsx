"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Input, Label, TextField, toast } from "@heroui/react";
import type { SortDescriptor } from "@heroui/react";
import { authClient } from "@/app/lib/auth-client";
import { UsersTable } from "./UsersTable";
import { CreateUserModal } from "./CreateUserModal";
import type { Role, User } from "./types";

const LIMIT = 20;

const DEFAULT_SORT: SortDescriptor = {
  column: "createdAt",
  direction: "descending",
};

export default function UsersManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // `query` is the raw input; `search` is the debounced value actually sent.
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");

  const [sort, setSort] = useState<SortDescriptor>(DEFAULT_SORT);

  const [showCreate, setShowCreate] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await authClient.admin.listUsers({
        query: {
          limit: LIMIT,
          offset: (page - 1) * LIMIT,
          sortBy: String(sort.column),
          sortDirection: sort.direction === "ascending" ? "asc" : "desc",
          ...(search && {
            searchValue: search,
            searchField: "email",
            searchOperator: "contains",
          }),
        },
      });

      if (error) {
        toast.danger(error.message || "Failed to load users");
        return;
      }

      setUsers((data?.users as User[]) || []);
      setTotal(data?.total || 0);
    } catch {
      toast.danger("Something went wrong loading users");
    } finally {
      setLoading(false);
    }
  }, [page, search, sort]);

  // Server-side sorting: apply the new descriptor and snap back to page 1.
  function handleSortChange(descriptor: SortDescriptor) {
    setSort(descriptor);
    setPage(1);
  }

  // Debounce the search box and snap back to the first page when it changes.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(query.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  // Fetch on page/search change. Deferred to a microtask so the loading toggle
  // doesn't fire synchronously inside the effect body (set-state-in-effect).
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchUsers();
    });
    return () => {
      active = false;
    };
  }, [fetchUsers]);

  async function handleCreate(input: {
    name: string;
    email: string;
    password: string;
    role: Role;
  }) {
    const { error } = await authClient.admin.createUser(input);
    if (error) {
      throw new Error(error.message || "Failed to create user");
    }
    setShowCreate(false);
    toast.success("User created");
    await fetchUsers();
  }

  async function handleSetRole(userId: string, role: Role) {
    const { error } = await authClient.admin.setRole({ userId, role });
    if (error) {
      toast.danger(error.message || "Couldn't update role");
      throw error;
    }
    toast.success("Role updated");
    await fetchUsers();
  }

  async function handleBan(userId: string) {
    const { error } = await authClient.admin.banUser({
      userId,
      banReason: "Banned by admin",
    });
    if (error) {
      toast.danger(error.message || "Couldn't ban user");
      throw error;
    }
    toast.success("User banned");
    await fetchUsers();
  }

  async function handleUnban(userId: string) {
    const { error } = await authClient.admin.unbanUser({ userId });
    if (error) {
      toast.danger(error.message || "Couldn't unban user");
      throw error;
    }
    toast.success("User unbanned");
    await fetchUsers();
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        User Management
      </h1>

      {/* Toolbar: search (left) and create (right) on one row */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <TextField
          aria-label="Search users by email"
          className="w-full max-w-sm"
          value={query}
          onChange={setQuery}
        >
          <Label className="sr-only">Search users</Label>
          <Input placeholder="Search by email…" />
        </TextField>
        <Button className="shrink-0" onPress={() => setShowCreate(true)}>
          <span aria-hidden className="text-base leading-none">
            +
          </span>
          Create admin
        </Button>
      </div>

      <UsersTable
        users={users}
        loading={loading}
        sortDescriptor={sort}
        onSortChange={handleSortChange}
        page={page}
        total={total}
        limit={LIMIT}
        totalPages={totalPages}
        onPageChange={setPage}
        onSetRole={handleSetRole}
        onBan={handleBan}
        onUnban={handleUnban}
      />

      <CreateUserModal
        isOpen={showCreate}
        onOpenChange={setShowCreate}
        onCreate={handleCreate}
      />
    </div>
  );
}
