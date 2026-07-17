/**
 * @file frontend/src/pages/auth/ForgotPasswordPage.tsx
 */

import { useState, type FormEvent } from "react";
import { forgotPassword } from "@/api/auth";
import { AuthLayout } from "./AuthLayout";
import { Link } from "react-router-dom";

import styles from "./shared.module.css";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<unknown>(null);
  // same "lock in success" pattern as ResendVerificationPage (Part 6-C-3) —
  // once true, we never show the form again for this page visit
  const [hasSubmitted, setHasSubmitted] = useState(false);

  function validate(): string | null {
    if (!email.trim()) return "Email is required.";
    if (!email.includes("@")) return "Please enter a valid email.";
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    const validationMessage = validate();
    if (validationMessage) {
      setSubmitError(new Error(validationMessage));
      return;
    }

    setIsSubmitting(true);
    try {
      await forgotPassword({ email });
      // 🚩 same privacy-preserving pattern as resendVerificationCtrl: the
      // backend ALWAYS responds the same way, whether the email exists or
      // not (see forgotPasswordCtrl's early "if (!user)" branch, which
      // returns the SAME message as the success path). We don't inspect
      // the response at all — we just always show success.
      setHasSubmitted(true);
    } catch (error) {
      // a genuine failure here means something actually broke (network,
      // server error) — "email doesn't exist" never reaches this catch
      setSubmitError(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const generalError =
    submitError instanceof Error
      ? submitError.message
      : submitError
        ? "Something went wrong. Please try again."
        : null;

  if (hasSubmitted) {
    return (
      <AuthLayout title="Check your email">
        <div className={styles.form}>
          <p>If the email exists, a password reset link has been sent.</p>
          <Link
            to="/login"
            className={styles.submitButton}
            style={{ textAlign: "center" }}
          >
            Back to login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a reset link"
      footer={
        <p>
          Remembered it after all? <Link to="/login">Log in</Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} noValidate className={styles.form}>
        {generalError && (
          <div role="alert" className={styles.banner}>
            {generalError}
          </div>
        )}

        <div className={styles.field}>
          <label htmlFor="email" className={styles.label}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={styles.submitButton}
        >
          {isSubmitting ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </AuthLayout>
  );
}
