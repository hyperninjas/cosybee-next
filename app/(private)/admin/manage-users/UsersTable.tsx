"use client";

import {
  Chip,
  EmptyState,
  Pagination,
  Spinner,
  Table,
  cn,
} from "@heroui/react";
import type { SortDescriptor } from "@heroui/react";
import { RoleSelect } from "./RoleSelect";
import { UserRowActions } from "./UserRowActions";
import type { Role, User } from "./types";

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

/** Column header that shows a chevron reflecting the active sort direction. */
function SortableHeader({
  children,
  sortDirection,
}: {
  children: React.ReactNode;
  sortDirection?: "ascending" | "descending";
}) {
  return (
    <span className="flex items-center gap-1">
      {children}
      {!!sortDirection && (
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          className={cn(
            "size-3 transition-transform duration-100",
            sortDirection === "descending" ? "rotate-180" : "",
          )}
        >
          <path
            d="M6 15l6-6 6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}

export function UsersTable({
  users,
  loading,
  sortDescriptor,
  onSortChange,
  page,
  total,
  limit,
  totalPages,
  onPageChange,
  onSetRole,
  onBan,
  onUnban,
}: {
  users: User[];
  loading: boolean;
  sortDescriptor: SortDescriptor;
  onSortChange: (descriptor: SortDescriptor) => void;
  page: number;
  total: number;
  limit: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSetRole: (userId: string, role: Role) => Promise<void>;
  onBan: (userId: string) => Promise<void>;
  onUnban: (userId: string) => Promise<void>;
}) {
  // While loading we feed the body an empty collection so `renderEmptyState`
  // owns the in-table loading/empty UI — the header and footer stay mounted.
  const items = loading ? [] : users;
  const showNumberedPages = totalPages > 1 && totalPages <= 7;
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = Math.min(page * limit, total);

  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content
          aria-label="Users"
          className="min-w-190"
          sortDescriptor={sortDescriptor}
          onSortChange={onSortChange}
        >
          <Table.Header>
            <Table.Column allowsSorting isRowHeader id="name">
              {({ sortDirection }) => (
                <SortableHeader sortDirection={sortDirection}>
                  User
                </SortableHeader>
              )}
            </Table.Column>
            <Table.Column id="role">Role</Table.Column>
            <Table.Column id="status">Status</Table.Column>
            <Table.Column allowsSorting id="createdAt">
              {({ sortDirection }) => (
                <SortableHeader sortDirection={sortDirection}>
                  Created
                </SortableHeader>
              )}
            </Table.Column>
            <Table.Column className="text-end" id="actions">
              Actions
            </Table.Column>
          </Table.Header>

          <Table.Body
            items={items}
            renderEmptyState={() =>
              loading ? (
                <EmptyState className="flex h-full min-h-65 w-full items-center justify-center">
                  <Spinner size="lg" />
                </EmptyState>
              ) : (
                <EmptyState className="flex h-full min-h-65 w-full flex-col items-center justify-center gap-2 text-center">
                  <span className="text-sm font-medium text-foreground">
                    No users found
                  </span>
                  <span className="text-xs text-muted">
                    Try a different search, or create an admin user.
                  </span>
                </EmptyState>
              )
            }
          >
            {(user) => (
              <Table.Row id={user.id}>
                <Table.Cell>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">
                      {user.name}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-muted">
                      {user.email}
                      {user.emailVerified && (
                        <Chip color="success" size="sm" variant="soft">
                          Verified
                        </Chip>
                      )}
                    </span>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <RoleSelect
                    userName={user.name}
                    role={(user.role as Role) || "user"}
                    onChange={(role) => onSetRole(user.id, role)}
                  />
                </Table.Cell>
                <Table.Cell>
                  {user.banned ? (
                    <Chip color="danger" size="sm" variant="soft">
                      Banned
                    </Chip>
                  ) : (
                    <Chip color="success" size="sm" variant="soft">
                      Active
                    </Chip>
                  )}
                </Table.Cell>
                <Table.Cell className="text-muted">
                  {new Date(user.createdAt).toLocaleDateString(
                    "en-GB",
                    DATE_FORMAT,
                  )}
                </Table.Cell>
                <Table.Cell className="text-end">
                  <UserRowActions user={user} onBan={onBan} onUnban={onUnban} />
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>

      {total > 0 && (
        <Table.Footer>
          <Pagination size="sm" className="w-full">
            <Pagination.Summary>
              Showing {rangeStart}–{rangeEnd} of {total} users
            </Pagination.Summary>
            <Pagination.Content>
              <Pagination.Item>
                <Pagination.Previous
                  isDisabled={page <= 1 || loading}
                  onPress={() => onPageChange(Math.max(1, page - 1))}
                >
                  <Pagination.PreviousIcon />
                  Prev
                </Pagination.Previous>
              </Pagination.Item>

              {showNumberedPages &&
                Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Pagination.Item key={p}>
                    <Pagination.Link
                      isActive={p === page}
                      onPress={() => onPageChange(p)}
                    >
                      {p}
                    </Pagination.Link>
                  </Pagination.Item>
                ))}

              <Pagination.Item>
                <Pagination.Next
                  isDisabled={page >= totalPages || loading}
                  onPress={() => onPageChange(Math.min(totalPages, page + 1))}
                >
                  Next
                  <Pagination.NextIcon />
                </Pagination.Next>
              </Pagination.Item>
            </Pagination.Content>
          </Pagination>
        </Table.Footer>
      )}
    </Table>
  );
}
