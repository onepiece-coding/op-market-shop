/**
 * @file frontend/src/components/layout/header/index.tsx
 */

import { NavLink, Link } from "react-router-dom";
import { cacheKeys } from "@/cache/cacheKeys";
import { useFetch } from "@/hooks/useFetch";
import { Icon } from "@/components/icons";
import { getCart } from "@/api/cart";
import { useAuth } from "@/hooks";
import { cx } from "@/utils/cx";

import styles from "./styles.module.css";

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();

  // 🚩 "enabled: isAuthenticated".
  // An anonymous visitor should NEVER trigger this fetch at all, since
  // cartRoutes.use(authMiddleware) guarantees it would just fail with a 401.
  const { data: cartItems } = useFetch(cacheKeys.cart.all(), getCart, {
    enabled: isAuthenticated,
  });

  const cartCount = cartItems?.length ?? 0;

  // shared here so both Header AND the nav helper below stay in sync,
  // and so NavLink's className function reads cleanly
  function navLinkClassName({ isActive }: { isActive: boolean }): string {
    return cx(styles.navLink, isActive && styles.navLinkActive);
  }

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand}>
          op-market
        </Link>

        <nav className={styles.nav} aria-label="Main navigation">
          <NavLink to="/" end className={navLinkClassName}>
            Shop
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/orders" className={navLinkClassName}>
              My Orders
            </NavLink>
          )}
          {user?.role === "ADMIN" && (
            <NavLink to="/admin" className={navLinkClassName}>
              Admin
            </NavLink>
          )}
        </nav>

        <div className={styles.actions}>
          <Link
            to="/cart"
            className={styles.cartLink}
            aria-label={`Cart, ${cartCount} items`}
          >
            <Icon name="cart" />
            {cartCount > 0 && (
              <span className={styles.cartBadge}>{cartCount}</span>
            )}
          </Link>

          {isAuthenticated ? (
            <>
              <Link to="/profile" className={styles.profileLink}>
                <Icon name="user" label="Profile" />
                <span>{user?.name}</span>
              </Link>
              <button onClick={() => logout()} className={styles.logoutButton}>
                Log out
              </button>
            </>
          ) : (
            <div className={styles.authLinks}>
              <Link to="/login">Log in</Link>
              <Link to="/signup" className={styles.signupLink}>
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
