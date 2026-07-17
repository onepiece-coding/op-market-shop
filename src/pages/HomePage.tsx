/**
 * @file frontend/src/pages/HomePage.tsx
 */

import { Link } from "react-router-dom";
import { useAuth } from "@/hooks";

import styles from "./shared.module.css";

// A simple placeholder homepage. Part 8 will replace this with the real
// Shop page (product grid, search, etc.) — for now, this exists purely
// to give our router a real "/" destination and a couple of real links
// to prove navigation works end-to-end.
export function HomePage() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className={styles.page}>
      <h1>Welcome to op-market 🏴‍☠️</h1>
      <p>The shop page is coming soon in Part 8.</p>

      <nav className={styles.nav}>
        {isAuthenticated ? (
          <>
            <span>Hi, {user?.name}</span>
            <Link to="/cart">Cart</Link>
            <Link to="/orders">My Orders</Link>
            <button onClick={() => logout()}>Log out</button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/signup">Sign up</Link>
          </>
        )}
      </nav>
    </div>
  );
}
