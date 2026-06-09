"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  // `loading` drives the full skeleton (first load only); `busy` is the
  // lightweight indicator for silent refetches (sort, search, paginate).
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const hasLoadedRef = useRef(false);

  // `query` is the raw input; `search` is the debounced value actually sent.
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");

  const [sort, setSort] = useState<SortDescriptor>(DEFAULT_SORT);

  const [showCreate, setShowCreate] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  // `silent` refreshes the data without flipping the skeleton — keeps the
  // current rows visible under a `busy` indicator instead of a full reload.
  const fetchUsers = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent ?? false;
      if (silent) setBusy(true);
      else setLoading(true);
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
        if (silent) setBusy(false);
        else setLoading(false);
      }
    },
    [page, search, sort],
  );

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

  // Fetch on page/search/sort change. The first load shows the skeleton; every
  // subsequent refetch runs silently (rows stay, busy indicator shows).
  // Deferred to a microtask so the toggle doesn't fire synchronously inside the
  // effect body (set-state-in-effect).
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      // Read/mark "loaded" only when a fetch actually runs — NOT in the effect
      // body. Otherwise a StrictMode mount that's immediately torn down would
      // flip the ref, making the first real fetch run `silent` (busy only) and
      // leaving `loading` stuck true → the table never leaves the skeleton.
      const silent = hasLoadedRef.current;
      hasLoadedRef.current = true;
      fetchUsers({ silent });
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
    // Background refresh (no skeleton) so the new user appears in place.
    await fetchUsers({ silent: true });
  }

  // Patch a single user in place — the basis for optimistic row updates.
  function patchUser(userId: string, patch: Partial<User>) {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, ...patch } : u)),
    );
  }

  async function handleSetRole(userId: string, role: Role) {
    let prevRole: string | undefined;
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        prevRole = u.role;
        return { ...u, role };
      }),
    );
    const { error } = await authClient.admin.setRole({ userId, role });
    if (error) {
      patchUser(userId, { role: prevRole }); // revert
      toast.danger(error.message || "Couldn't update role");
      throw error;
    }
    toast.success("Role updated");
  }

  async function handleBan(userId: string) {
    patchUser(userId, { banned: true }); // optimistic
    const { error } = await authClient.admin.banUser({
      userId,
      banReason: "Banned by admin",
    });
    if (error) {
      patchUser(userId, { banned: false }); // revert
      toast.danger(error.message || "Couldn't ban user");
      throw error;
    }
    toast.success("User banned");
  }

  async function handleUnban(userId: string) {
    patchUser(userId, { banned: false }); // optimistic
    const { error } = await authClient.admin.unbanUser({ userId });
    if (error) {
      patchUser(userId, { banned: true }); // revert
      toast.danger(error.message || "Couldn't unban user");
      throw error;
    }
    toast.success("User unbanned");
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-foreground sm:mb-6 sm:text-2xl">
        User Management
      </h1>

      {/* Toolbar: stacks on mobile, search + create side-by-side from sm up. */}
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <TextField
          aria-label="Search users by email"
          className="w-full sm:max-w-sm"
          value={query}
          onChange={setQuery}
        >
          <Label className="sr-only">Search users</Label>
          <Input variant="secondary" placeholder="Search by email…" />
        </TextField>
        <Button
          className="w-full shrink-0 sm:w-auto"
          onPress={() => setShowCreate(true)}
        >
          <span aria-hidden className="text-base leading-none">
            +
          </span>
          Create admin
        </Button>
      </div>

      <UsersTable
        users={users}
        loading={loading}
        busy={busy}
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
