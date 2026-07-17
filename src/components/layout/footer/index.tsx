/**
 * @file frontend/src/components/layout/footer/index.tsx
 */

// import { Link } from "react-router-dom";

import styles from "./styles.module.css";

export function Footer() {
  // computed once per render — fine for a footer, which re-renders
  // extremely rarely (its content is entirely static)
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>op-market</div>
        {/* <nav className={styles.links} aria-label="Footer navigation">
          <Link to="/">Shop</Link>
          <Link to="/cart">Cart</Link>
          <Link to="/login">Log in</Link>
        </nav> */}
        <p className={styles.copyright}>
          © {currentYear} op-market. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
