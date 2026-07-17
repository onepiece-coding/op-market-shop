/**
 * @file frontend/src/pages/auth/ResendVerificationPage.tsx
 */

import { useState, type FormEvent } from "react";
import { resendVerification } from "@/api/auth";
import { AuthLayout } from "./AuthLayout";
import { Link } from "react-router-dom";

import styles from "./shared.module.css";

export function ResendVerificationPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<unknown>(null);
  // once true, we permanently swap to the "check your email" view for
  // this page visit — there's no reason to let them submit again
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
      await resendVerification({ email });
      // 🚩 we don't inspect the response at all here — resendVerificationCtrl
      // ALWAYS returns the same generic message regardless of whether the
      // email exists or is already verified (a deliberate privacy choice
      // on the backend). We simply mirror that: always show success.
      setHasSubmitted(true);
    } catch (error) {
      // a genuine failure here (network down, server error) is different
      // from "email doesn't exist" — THAT case still resolves successfully
      // on the backend, so only a real error reaches this catch block
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
          <p>
            If the email exists and is not verified, a verification email has
            been sent.
          </p>
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
      title="Resend verification email"
      subtitle="Enter your email and we'll send a new link"
      footer={
        <p>
          Remembered your password? <Link to="/login">Log in</Link>
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
          {isSubmitting ? "Sending…" : "Send verification link"}
        </button>
      </form>
    </AuthLayout>
  );
}
