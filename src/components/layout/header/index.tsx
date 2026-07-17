/**
 * @file frontend/src/components/layout/header/index.tsx
 */

import { NavLink, Link, useLocation } from "react-router-dom";
import { cacheKeys } from "@/cache/cacheKeys";
import { useEffect, useState } from "react";
import { useFetch } from "@/hooks/useFetch";
import { Icon } from "@/components/icons";
import { getCart } from "@/api/cart";
import { useAuth } from "@/hooks";
import { cx } from "@/utils/cx";

import styles from "./styles.module.css";

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();

  const location = useLocation();

  // 🚩 same auto-close-on-navigation pattern as AdminSidebar (Part 9-A):
  // without this, tapping a link correctly navigates, but the dropdown
  // is left sitting open on top of the very page it just navigated to.
  useEffect(() => {
    queueMicrotask(() => setIsMobileMenuOpen(false));
  }, [location.pathname]);

  const { data: cartItems } = useFetch(cacheKeys.cart.all(), getCart, {
    enabled: isAuthenticated,
  });

  const cartCount = cartItems?.length ?? 0;

  function navLinkClassName({ isActive }: { isActive: boolean }): string {
    return cx(styles.navLink, isActive && styles.navLinkActive);
  }

  // ONE shared list of links, rendered inside BOTH the desktop <nav> and
  // the mobile dropdown <nav> below. CSS alone decides which one is
  // actually visible at any given screen width — this keeps the two
  // navs impossible to accidentally drift out of sync with each other.
  const navLinks = (
    <>
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
    </>
  );

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand}>
          op-market
        </Link>

        <nav className={styles.nav} aria-label="Main navigation">
          {navLinks}
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
                <span className={styles.username}>{user?.name}</span>
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

          {/* 🚩 THE FIX: only visible below the 768px breakpoint (see
              CSS) — toggles the mobile nav dropdown. The icon itself
              carries NO "label" prop, since this button already has its
              own aria-label — giving the icon one too would make screen
              readers announce the button's name twice (Part 7-C's rule). */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav"
            className={styles.menuButton}
          >
            <Icon name={isMobileMenuOpen ? "close" : "chevronDown"} />
          </button>
        </div>
      </div>

      {/* same conditional-render pattern as AdminSidebar's overlay
          (Part 9-A) — only exists in the DOM at all while open */}
      {isMobileMenuOpen && (
        <div
          className={styles.mobileOverlay}
          onClick={() => setIsMobileMenuOpen(false)}
          data-testid="mobile-nav-overlay"
        />
      )}

      {/* ALWAYS rendered (unlike the overlay), so the slide/fade
          transition below has something to animate FROM and TO —
          visibility is controlled purely by the "mobileNavOpen" class */}
      <nav
        id="mobile-nav"
        aria-label="Mobile navigation"
        className={cx(
          styles.mobileNav,
          isMobileMenuOpen && styles.mobileNavOpen,
        )}
      >
        {navLinks}
      </nav>
    </header>
  );
}
