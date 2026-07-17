/**
 * @file frontend/src/routes/AdminRoute.tsx
 */

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks";

/**
 * AdminRoute guards the entire Admin Panel (Part 9) — requires BOTH being
 * logged in AND having role === "ADMIN". We deliberately repeat the
 * isInitializing/isAuthenticated checks here (instead of assuming this is
 * always nested inside a ProtectedRoute) so this component is safe and
 * correct entirely on its own.
 */
export function AdminRoute() {
  const { user, isAuthenticated, isInitializing } = useAuth();

  const location = useLocation();

  if (isInitializing) {
    return (
      <div role="status" aria-label="Loading">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 🚩 This mirrors your backend's OWN adminMiddleware exactly:
  //   if (user?.role === "ADMIN") return next();
  //   else if (user) return next(createError(403, "Forbidden: admin only"));
  // A logged-in NON-admin isn't "not logged in" — they're logged in but
  // FORBIDDEN. Sending them to /login would be confusing (they ARE logged
  // in!), so we send them to the homepage instead.
  if (user?.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
