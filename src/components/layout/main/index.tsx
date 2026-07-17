/**
 * @file frontend/src/components/layout/main/index.tsx
 */

import { useFocusMainOnRouteChange } from "@/hooks";
import { Outlet } from "react-router-dom";
import { SkipLink } from "../skip-link";
import { Footer, Header } from "..";
import { Suspense, useRef } from "react";

import styles from "./styles.module.css";
import { Spinner } from "@/components/ui";

// This is the SHARED shell every real page (Shop, Cart, Orders, Product
// Detail...) renders inside of, via <Outlet />. Auth pages (Login,
// Signup, etc.) deliberately do NOT use this layout — they use their
// own centered AuthLayout (Part 6-C-1) instead, which makes sense: you
// don't need a cart badge or nav links while logging in.
export function MainLayout() {
  const mainRef = useRef<HTMLElement>(null);
  useFocusMainOnRouteChange(mainRef);

  return (
    <div className={styles.page}>
      <SkipLink />
      <Header />
      {/* id="main-content" is the SkipLink's target; tabIndex={-1} makes
          it a valid focus target for our route-change hook, without
          ever appearing in the normal Tab sequence itself */}
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
      <Footer />
    </div>
  );
}
