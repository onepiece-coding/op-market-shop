/**
 * @file frontend/src/pages/auth/AuthLayout.tsx
 */

import type { ReactNode } from "react";

import styles from "./AuthLayout.module.css";

interface AuthLayoutProps {
  title: string; // the big heading, e.g. "Welcome back"
  subtitle?: string; // optional smaller text under the title
  children: ReactNode; // the actual form goes here
  footer?: ReactNode; // optional bottom link, e.g. "Don't have an account? Sign up"
}

// A shared visual "frame" for every auth page (Login, Signup, Verify Email,
// Forgot/Reset Password) — a centered card on a soft background. Building
// this once means all five pages look and feel consistent automatically.
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>op-market</div>
        <h1 className={styles.title}>{title}</h1>
        {/* only render the subtitle paragraph if one was actually given */}
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        {children}
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
}
