/**
 * @file frontend/src/pages/ComingSoonPage.tsx
 */

import { Link } from "react-router-dom";

import styles from "./shared.module.css";

interface ComingSoonPageProps {
  title: string; // e.g. "Cart", "Admin Products" — shown in the placeholder text
}

// A shared, honest placeholder for any route whose REAL page hasn't been
// built yet (Cart/Checkout/Orders/Profile come in Part 8, the Admin Panel
// comes in Part 9). This lets us wire and TEST our real route guards
// right now, without waiting for every feature to exist first.
export function ComingSoonPage({ title }: ComingSoonPageProps) {
  return (
    <div className={styles.page}>
      <h1>{title}</h1>
      <p>🚧 This page is coming soon.</p>
      <Link to="/">Back to home</Link>
    </div>
  );
}
