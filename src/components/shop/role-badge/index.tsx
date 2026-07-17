/**
 * @file frontend/src/components/shop/role-badge/index.tsx
 */

import type { Role } from "@/types/user";
import { cx } from "@/utils/cx";

import styles from "./styles.module.css";

export interface RoleBadgeProps {
  role: Role;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  return (
    <span
      className={cx(
        styles.badge,
        role === "ADMIN" ? styles.admin : styles.user,
      )}
    >
      {role === "ADMIN" ? "Admin" : "User"}
    </span>
  );
}
