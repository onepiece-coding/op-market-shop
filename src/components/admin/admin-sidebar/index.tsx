/**
 * @file frontend/src/components/admin/admin-sidebar/index.tsx
 */

import { useFocusTrap } from "@/hooks/useFocusTrap";
import { NavLink } from "react-router-dom";
import { Icon } from "@/components/icons";
import { cx } from "@/utils";

import styles from "./styles.module.css";

export interface AdminSidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: "home", end: true },
  { to: "/admin/products", label: "Products", icon: "package", end: false },
  { to: "/admin/orders", label: "Orders", icon: "cart", end: false },
  { to: "/admin/users", label: "Users", icon: "user", end: false },
] as const;

function navLinkClassName({ isActive }: { isActive: boolean }): string {
  return cx(styles.navLink, isActive && styles.navLinkActive);
}

export function AdminSidebar({
  isMobileOpen,
  onMobileClose,
}: AdminSidebarProps) {
  // Same shared hook as Modal — ONLY actually traps focus/locks scroll
  // while the mobile off-canvas version is open. On desktop, isMobileOpen
  // is never toggled true (there's no hamburger button to open it, since
  // the sidebar is already permanently visible via CSS), so this hook is
  // simply inert there.
  const panelRef = useFocusTrap<HTMLElement>({
    isActive: isMobileOpen,
    onEscape: onMobileClose,
  });

  const navList = (
    <nav aria-label="Admin navigation" className={styles.nav}>
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={navLinkClassName}
          onClick={onMobileClose}
        >
          <Icon name={item.icon} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );

  return (
    <>
      {/* Permanently visible on desktop; hidden via CSS below 900px. */}
      <aside className={styles.desktopSidebar}>
        <div className={styles.brand}>op-market admin</div>
        {navList}
      </aside>

      {/* Mobile off-canvas version — only rendered/interactive when open. */}
      {isMobileOpen && (
        <div
          data-testid="sidebar-overlay"
          className={styles.overlay}
          onClick={(event) => {
            if (event.target === event.currentTarget) onMobileClose();
          }}
        >
          <aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation menu"
            tabIndex={-1}
            className={styles.mobilePanel}
          >
            <div className={styles.mobileHeader}>
              <span className={styles.brand}>op-market admin</span>
              <button
                type="button"
                onClick={onMobileClose}
                aria-label="Close menu"
                className={styles.closeButton}
              >
                <Icon name="close" />
              </button>
            </div>
            {navList}
          </aside>
        </div>
      )}
    </>
  );
}
