/**
 * @file frontend/src/components/layout/skip-link/index.tsx
 */

import styles from "./styles.module.css";

// A single link, the VERY FIRST focusable element on every page. It's
// visually hidden by default — sighted mouse users never see it — but
// the instant a keyboard user presses Tab, it becomes visible and
// focused, letting them jump straight past the entire header in one
// keystroke instead of tabbing through every nav link first.
export function SkipLink() {
  return (
    <a href="#main-content" className={styles.link}>
      Skip to main content
    </a>
  );
}
