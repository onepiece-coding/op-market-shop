import { Link } from "react-router-dom";
import { usePageMeta } from "@/hooks";

import styles from "./shared.module.css";

// Renders for any URL that doesn't match ANY of our routes at all —
// registered as the last, catch-all route in AppRoutes below.
export function NotFoundPage() {
  usePageMeta({ title: "Page not found", noIndex: true });

  return (
    <div className={styles.page}>
      <h1>404 — Page not found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <Link to="/">Back to home</Link>
    </div>
  );
}
