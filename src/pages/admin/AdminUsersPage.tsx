/**
 * @file frontend/src/pages/admin/AdminUsersPage.tsx
 */

import { ConfirmDialog, Button, Spinner, Pagination } from "@/components/ui";
import {
  useAuth,
  useToast,
  useMutate,
  usePagedFetch,
  usePageMeta,
} from "@/hooks";
import { invalidateExact, CacheStore, cacheKeys } from "@/cache";
import { listUsers, changeUserRole } from "@/api/users";
import type { PublicUser, Role } from "@/types/user";
import { RoleBadge } from "@/components/shop";
import { useState } from "react";

import styles from "./AdminUsersPage.module.css";

const PAGE_SIZE = 10;

export function AdminUsersPage() {
  usePageMeta({ title: "Admin — Users", noIndex: true });

  const { user: currentAdmin } = useAuth();
  const { showToast } = useToast();

  // holds the user we're ABOUT to change the role of, and the NEW role
  // we're proposing — null means "no confirmation dialog open"
  const [pendingChange, setPendingChange] = useState<{
    user: PublicUser;
    newRole: Role;
  } | null>(null);

  const {
    data: users,
    page,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,
    pagination,
    isLoading,
    isValidating,
    error,
  } = usePagedFetch(
    (pageNumber) =>
      cacheKeys.users.list({ page: pageNumber, limit: PAGE_SIZE }),
    (pageNumber) => listUsers({ page: pageNumber, limit: PAGE_SIZE }),
  );

  const { mutate: changeRole, isLoading: isChangingRole } = useMutate(
    (input: { id: number; role: Role }) =>
      changeUserRole(input.id, { role: input.role }),
    {
      onSuccess: (_data, _variables, store: CacheStore) => {
        // Strategy 1 from Part 4-C: this list is the ONLY place a role
        // shows up anywhere in the app — one exact key, invalidated directly.
        invalidateExact(
          store,
          cacheKeys.users.list({ page, limit: PAGE_SIZE }),
        );
        showToast("User role updated.", "success");
        setPendingChange(null);
      },
      onError: () => {
        showToast(
          "Could not update this user's role. Please try again.",
          "error",
        );
      },
    },
  );

  function handleConfirmRoleChange() {
    if (!pendingChange) return;
    changeRole({
      id: pendingChange.user.id,
      role: pendingChange.newRole,
    }).catch(() => {});
  }

  if (isLoading) {
    return (
      <div className={styles.centered}>
        <Spinner label="Loading users" size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className={styles.errorBanner}>
        Something went wrong while loading users. Please try again.
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1>Users</h1>

      {users.length === 0 ? (
        <p className={styles.emptyState}>No users found.</p>
      ) : (
        <div className={styles.tableWrapper} data-testid="users-table-wrapper">
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Role</th>
                <th scope="col">Verified</th>
                <th scope="col">Joined</th>
                <th scope="col" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isSelf = user.id === currentAdmin?.id;
                const nextRole: Role = user.role === "ADMIN" ? "USER" : "ADMIN";

                return (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <RoleBadge role={user.role} />
                    </td>
                    <td>{user.emailVerifiedAt ? "Yes" : "No"}</td>
                    <td className={styles.dateCell}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={isSelf}
                        title={
                          isSelf
                            ? "You cannot change your own admin role."
                            : undefined
                        }
                        onClick={() =>
                          setPendingChange({ user, newRole: nextRole })
                        }
                      >
                        {user.role === "ADMIN"
                          ? "Demote to User"
                          : "Promote to Admin"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={page}
        totalPages={pagination?.totalPages}
        hasNextPage={hasNextPage}
        hasPrevPage={hasPrevPage}
        onNext={nextPage}
        onPrev={prevPage}
        isLoading={isValidating}
      />

      <ConfirmDialog
        isOpen={pendingChange !== null}
        onClose={() => setPendingChange(null)}
        onConfirm={handleConfirmRoleChange}
        title="Change user role?"
        message={
          pendingChange
            ? `Are you sure you want to change "${pendingChange.user.name}"'s role to ${
                pendingChange.newRole === "ADMIN" ? "Admin" : "User"
              }?`
            : ""
        }
        confirmLabel="Confirm"
        variant="primary"
        isLoading={isChangingRole}
      />
    </div>
  );
}
