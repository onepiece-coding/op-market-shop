/**
 * @file frontend/src/routes/lazyAdminPages.ts
 */

import { lazy } from "react";

// React.lazy() expects a module with a DEFAULT export, but every page in
// this app uses NAMED exports (our convention since Part 1). The
// ".then((m) => ({ default: m.AdminProductsPage }))" step bridges that
// gap — it takes the real module once it loads, and hands React a tiny
// wrapper object shaped exactly the way React.lazy expects, without us
// ever needing to change how these pages export themselves.
export const AdminProductsPage = lazy(() =>
  import("@/pages/admin/AdminProductsPage").then((m) => ({
    default: m.AdminProductsPage,
  })),
);

export const AdminOrdersPage = lazy(() =>
  import("@/pages/admin/AdminOrdersPage").then((m) => ({
    default: m.AdminOrdersPage,
  })),
);

export const AdminUsersPage = lazy(() =>
  import("@/pages/admin/AdminUsersPage").then((m) => ({
    default: m.AdminUsersPage,
  })),
);
