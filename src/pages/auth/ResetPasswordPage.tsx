/**
 * @file frontend/src/pages/auth/ResetPasswordPage.tsx
 */

import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { getFieldError } from "@/utils/getFieldError";
import { useState, type FormEvent } from "react";
import { resetPassword } from "@/api/auth";
import { AuthLayout } from "./AuthLayout";

import styles from "./shared.module.css";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // same pattern as VerifyEmailPage (Part 6-C-3): the token travels in
  // the URL's query string, because it arrives via an email LINK, which
  // can only ever be a URL, not a form submission.
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<unknown>(null);
  const [hasSucceeded, setHasSucceeded] = useState(false);

  // this field-level check (passwords must match) is PURELY a client-side
  // convenience — resetPasswordSchema on the backend has no concept of a
  // "confirm password" field at all, since it never even reaches the server
  function validate(): string | null {
    if (!token) return "This reset link is missing its token.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (password !== confirmPassword) return "Passwords do not match.";
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
      // "!" is safe here: our validate() function above already confirmed
      // "token" is truthy before we ever reach this line
      await resetPassword({ token: token!, password });
      setHasSucceeded(true);
    } catch (error) {
      setSubmitError(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const passwordError = getFieldError(submitError, "password");
  const generalError =
    !passwordError && submitError
      ? submitError instanceof Error
        ? submitError.message
        : "Something went wrong. Please try again."
      : null;

  // 🚩 If there's no token at all, there's no reasonable form to show —
  // we short-circuit straight to a clear, actionable message instead of
  // letting someone fill out a form that can never succeed.
  if (!token) {
    return (
      <AuthLayout title="Invalid reset link">
        <div className={styles.form}>
          <p role="alert">
            This password reset link is missing its token. Please request a new
            one.
          </p>
          <Link
            to="/forgot-password"
            className={styles.submitButton}
            style={{ textAlign: "center" }}
          >
            Request a new reset link
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // 🚩 After a successful reset, we do NOT log the user in (see the "why"
  // section above — the backend deliberately clears cookies and revokes
  // every refresh token). We send them to Login instead, where they'll
  // use their BRAND NEW password for the first time.
  if (hasSucceeded) {
    return (
      <AuthLayout title="Password reset 🎉">
        <div className={styles.form}>
          <p>Your password has been reset successfully. Please log in again.</p>
          <button
            onClick={() => navigate("/login")}
            className={styles.submitButton}
          >
            Go to login
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="Enter and confirm your new password"
    >
      <form onSubmit={handleSubmit} noValidate className={styles.form}>
        {generalError && (
          <div role="alert" className={styles.banner}>
            {generalError}
          </div>
        )}

        <div className={styles.field}>
          <label htmlFor="password" className={styles.label}>
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={passwordError ? "true" : "false"}
            aria-describedby={passwordError ? "password-error" : undefined}
            className={styles.input}
          />
          {passwordError && (
            <p id="password-error" role="alert" className={styles.fieldError}>
              {passwordError}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="confirmPassword" className={styles.label}>
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={styles.input}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={styles.submitButton}
        >
          {isSubmitting ? "Resetting…" : "Reset password"}
        </button>
      </form>
    </AuthLayout>
  );
}
