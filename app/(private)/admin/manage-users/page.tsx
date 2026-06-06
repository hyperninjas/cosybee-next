"use client";
import { useState, useEffect } from "react";
import { authClient } from "@/app/lib/auth-client";

interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role?: string;
  banned?: boolean | null;
  createdAt: Date;
}

export default function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create user modal state
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState<{ name: string; email: string; password: string; role: "admin" | "user" }>({ name: "", email: "", password: "", role: "admin" });
  const [createError, setCreateError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  async function fetchUsers() {
    setLoading(true);
    try {
      const { data, error } = await authClient.admin.listUsers({
        query: {
          limit,
          offset: (page - 1) * limit,
          sortBy: "createdAt",
          sortDirection: "desc",
          ...(search && {
            searchValue: search,
            searchField: "email",
            searchOperator: "contains",
          }),
        },
      });

      if (error) {
        console.error("Failed to fetch users:", error);
        return;
      }

      setUsers(data?.users || []);
      setTotal(data?.total || 0);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
    setLoading(false);
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    setCreateLoading(true);

    try {
      const { error } = await authClient.admin.createUser({
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
      });

      if (error) {
        setCreateError(error.message || "Failed to create user");
        setCreateLoading(false);
        return;
      }

      // Success
      setShowCreate(false);
      setNewUser({ name: "", email: "", password: "", role: "admin" });
      fetchUsers();
    } catch {
      setCreateError("An error occurred");
    }
    setCreateLoading(false);
  }

  async function handleSetRole(userId: string, role: "admin" | "user") {
    try {
      await authClient.admin.setRole({
        userId,
        role,
      });
      fetchUsers();
    } catch (err) {
      console.error("Failed to set role:", err);
    }
  }

  async function handleBanUser(userId: string) {
    try {
      await authClient.admin.banUser({
        userId,
        banReason: "Banned by admin",
      });
      fetchUsers();
    } catch (err) {
      console.error("Failed to ban user:", err);
    }
  }

  async function handleUnbanUser(userId: string) {
    try {
      await authClient.admin.unbanUser({ userId });
      fetchUsers();
    } catch (err) {
      console.error("Failed to unban user:", err);
    }
  }

  // Refetch on page change. Deferred to a microtask so the spinner toggle
  // doesn't fire synchronously inside the effect body (set-state-in-effect).
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchUsers();
    });
    return () => {
      active = false;
    };
    // fetchUsers intentionally omitted from deps: search is applied via the
    // Search button, so we only auto-refetch when the page changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">User Management</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-5 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-accent hover:shadow-md transition-all"
        >
          + Create Admin
        </button>
      </div>

      {/* Search */}
      <div className="mb-6 flex gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (setPage(1), fetchUsers())}
          placeholder="Search by email..."
          className="flex-1 p-3 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
        />
        <button
          onClick={() => { setPage(1); fetchUsers(); }}
          className="px-5 py-2.5 bg-foreground text-white text-sm font-semibold rounded-lg hover:bg-foreground transition-all"
        >
          Search
        </button>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-gray-400" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-muted">
          No users found
        </div>
      ) : (
        <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-background">
                  <td className="px-4 py-3 text-sm text-foreground">{user.name}</td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {user.email}
                    {user.emailVerified && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success-soft text-success">
                        Verified
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role || "user"}
                      onChange={(e) => handleSetRole(user.id, e.target.value as "admin" | "user")}
                      className="p-1.5 text-sm border border-border rounded-md focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {user.banned ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-danger">
                        Banned
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success-soft text-success">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">
                    {user.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {user.banned ? (
                      <button
                        onClick={() => handleUnbanUser(user.id)}
                        className="text-sm font-medium text-success hover:text-success transition-colors"
                      >
                        Unban
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBanUser(user.id)}
                        className="text-sm font-medium text-danger hover:text-danger transition-colors"
                      >
                        Ban
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="mt-6 flex justify-between items-center">
        <span className="text-sm text-muted">
          Showing {users.length} of {total} users
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-muted">
            Page {page} of {totalPages || 1}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Next
          </button>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface p-6 rounded-xl w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-foreground">Create Admin User</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label htmlFor="create-name" className="block text-sm font-medium text-muted mb-1">
                  Name
                </label>
                <input
                  id="create-name"
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Full name"
                  required
                  className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label htmlFor="create-email" className="block text-sm font-medium text-muted mb-1">
                  Email
                </label>
                <input
                  id="create-email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="admin@example.com"
                  required
                  className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label htmlFor="create-password" className="block text-sm font-medium text-muted mb-1">
                  Password
                </label>
                <input
                  id="create-password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Min 8 characters"
                  minLength={8}
                  required
                  className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label htmlFor="create-role" className="block text-sm font-medium text-muted mb-1">
                  Role
                </label>
                <select
                  id="create-role"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as "admin" | "user" })}
                  className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                >
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
              </div>

              {createError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-danger text-sm">
                  {createError}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-background transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 text-sm font-semibold bg-foreground text-white rounded-lg hover:bg-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {createLoading ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
