/**
 * @file frontend/src/pages/auth/VerifyEmailPage.tsx
 */

import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { AuthLayout } from "./AuthLayout";
import { useAuth } from "@/hooks";

import styles from "./shared.module.css";

// Same "discriminated union" pattern as SignupPage's ScreenState (Part
// 6-C-2) — TypeScript makes it impossible to accidentally be in two
// states at once, or show a "success" screen with no message.
type VerifyState =
  | { status: "verifying" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export function VerifyEmailPage() {
  // useSearchParams reads the "?token=..." part of the CURRENT url —
  // this is how react-router-dom lets us access query string values
  const [searchParams] = useSearchParams();
  const { verifyEmail } = useAuth();
  const navigate = useNavigate();

  const token = searchParams.get("token"); // null if the link had no "token" at all

  const [state, setState] = useState<VerifyState>({ status: "verifying" });

  // 🚩 THIS is our fix for the StrictMode double-invoke problem explained
  // A ref survives across an effect running twice in the SAME mount
  // We use it as a simple "have we already tried this?" flag,
  // so the second StrictMode invocation does nothing at all.
  const hasAttemptedRef = useRef(false);

  useEffect(() => {
    if (hasAttemptedRef.current) return;
    hasAttemptedRef.current = true;

    if (!token) {
      queueMicrotask(() => {
        setState({
          status: "error",
          message: "This verification link is missing its token.",
        });
      });
      return;
    }

    verifyEmail(token)
      .then((response) => {
        setState({ status: "success", message: response.message });
      })
      .catch((error: unknown) => {
        setState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "This verification link is invalid or has expired.",
        });
      });
    // "verifyEmail" is intentionally left out of this dependency array —
    // it's a new function reference on every AuthProvider render (Part
    // 6-A doesn't wrap it in useCallback), but our hasAttemptedRef guard
    // above already ensures we only ever act on it once per mount anyway.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (state.status === "verifying") {
    return (
      <AuthLayout title="Verifying your email">
        {/* role="status" politely announces this to screen readers without interrupting them */}
        <p role="status">Please wait a moment…</p>
      </AuthLayout>
    );
  }

  if (state.status === "success") {
    return (
      <AuthLayout title="Email verified 🎉">
        <div className={styles.form}>
          <p>{state.message}</p>
          <button onClick={() => navigate("/")} className={styles.submitButton}>
            Continue to op-market
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Verification failed">
      <div className={styles.form}>
        <p role="alert">{state.message}</p>
        <Link
          to="/resend-verification"
          className={styles.submitButton}
          style={{ textAlign: "center" }}
        >
          Request a new verification link
        </Link>
      </div>
    </AuthLayout>
  );
}
