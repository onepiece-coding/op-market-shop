/**
 * @file frontend/src/routes/ProtectedRoute.tsx
 */

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks";

/**
 * ProtectedRoute guards any page that REQUIRES the visitor to be logged in
 * (Cart, Checkout, Orders, Profile). It's used as a "layout route" — see
 * Part 8 for how we nest real pages inside it.
 */
export function ProtectedRoute() {
  const { isAuthenticated, isInitializing } = useAuth();
  // useLocation() reads the CURRENT url (path, search params, etc.) —
  // we need this to remember "where were they headed?" for the redirect below
  const location = useLocation();

  /**
   * The most important detail,
   * and the reason we built isInitializing back in Part 6-A:
   * Picture a returning visitor with a valid refreshToken cookie,
   * navigating straight to /orders.
   * The instant our app boots, AuthContext.user is null,
   * not because they're logged out,
   * but simply because we haven't finished asking the server yet
   * (that getMe() call takes a brief moment).
   * If our guard checked isAuthenticated before that check finishes,
   * it would see false and incorrectly bounce a genuinely logged-in user to /login
   * for a split second — a jarring,
   * wrong "flash." This is exactly why ProtectedRoute checks isInitializing first,
   * and shows a simple loading state until we truly know the answer. *
   * */
  if (isInitializing) {
    return (
      <div role="status" aria-label="Loading">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    // "replace" swaps the CURRENT browser history entry instead of adding
    // a new one — so clicking the Back button after this redirect doesn't
    // just bounce the user right back into the page that redirected them.
    //
    // "state={{ from: location }}" is invisible to the user, but our
    // future Login page (Part 6-C) can read it to know exactly where to
    // send them back to after they successfully log in.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // The user IS logged in — render whichever real page matched this URL.
  return <Outlet />;
}
