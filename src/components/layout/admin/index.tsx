/**
 * @file frontend/src/components/layout/admin-layout/index.tsx
 */

import { AdminSidebar } from "@/components/admin";
import { Outlet, Link } from "react-router-dom";
import { Icon } from "@/components/icons";
import { Suspense, useRef, useState } from "react";

import styles from "./styles.module.css";
import { useFocusMainOnRouteChange } from "@/hooks";
import { SkipLink } from "../skip-link";
import { Spinner } from "@/components/ui";

// The shared shell for every admin page (Part 9-B/C/D). Nothing here
// re-checks role === "ADMIN" — that's AdminRoute's job (Part 6-B), and
// this component is only ever rendered as ITS child via <Outlet />.
export function AdminLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const mainRef = useRef<HTMLElement>(null);

  useFocusMainOnRouteChange(mainRef);

  return (
    <div className={styles.page}>
      <SkipLink />

      <AdminSidebar
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      <div className={styles.content}>
        <header className={styles.topBar}>
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            aria-label="Open admin menu"
            className={styles.menuButton}
          >
            <Icon name="chevronRight" />
          </button>
          <Link to="/" className={styles.backLink}>
            ← Back to shop
          </Link>
        </header>

        <main
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
          className={styles.main}
        >
          <Suspense
            fallback={
              <div className={styles.suspenseFallback}>
                <Spinner label="Loading page" size="lg" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
