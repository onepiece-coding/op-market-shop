/**
 * @file frontend/src/pages/auth/SignupPage.tsx
 */

import { getFieldError } from "@/utils/getFieldError";
import { useState, type FormEvent } from "react";
import { AuthLayout } from "./AuthLayout";
import { Link } from "react-router-dom";
import { useAuth, usePageMeta } from "@/hooks";

import styles from "./shared.module.css";

// The two possible "screens" this page can show. Using a plain string
// union like this (instead of, say, two separate booleans) makes it
// IMPOSSIBLE to accidentally represent an invalid combination — there's
// no way to be in "form" mode AND "success" mode at the same time.
type ScreenState =
  | { mode: "form" }
  | { mode: "success"; message: string; verificationEmailSent: boolean };

export function SignupPage() {
  usePageMeta({ title: "Sign up" });

  const { signUp } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<unknown>(null);
  const [screen, setScreen] = useState<ScreenState>({ mode: "form" });

  // matches signUpSchema's real rules as closely as we reasonably can on
  // the client — name required, valid-looking email, 6+ char password
  function validate(): string | null {
    if (!name.trim()) return "Name is required.";
    if (!email.trim()) return "Email is required.";
    if (!email.includes("@")) return "Please enter a valid email.";
    if (password.length < 6) return "Password must be at least 6 characters.";
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
      const response = await signUp({ name, email, password });
      // 🚩 we do NOT navigate anywhere here — signUp() never logs the user
      // in (Part 6-A). We just switch THIS page into its "success" screen.
      setScreen({
        mode: "success",
        message: response.message,
        verificationEmailSent: response.verificationEmailSent,
      });
    } catch (error) {
      setSubmitError(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const nameError = getFieldError(submitError, "name");
  const emailError = getFieldError(submitError, "email");
  const passwordError = getFieldError(submitError, "password");
  const generalError =
    !nameError && !emailError && !passwordError && submitError
      ? submitError instanceof Error
        ? submitError.message
        : "Something went wrong. Please try again."
      : null;

  // ---- SUCCESS SCREEN ----
  // Once signup succeeds, we render a COMPLETELY different view inside
  // the same AuthLayout shell, instead of the form.
  if (screen.mode === "success") {
    return (
      <AuthLayout title="Check your email">
        <div className={styles.form}>
          <p>{screen.message}</p>
          {screen.verificationEmailSent ? (
            <p>
              We sent a verification link to <strong>{email}</strong>. Click it
              to activate your account, then come back and log in.
            </p>
          ) : (
            // this handles the REAL edge case in signUpCtrl where the account
            // was created, but Brevo failed to actually send the email
            <p role="alert">
              We couldn&apos;t send the verification email right now. You can
              request a new one from the verification page once you try to log
              in.
            </p>
          )}
          <Link
            to="/login"
            className={styles.submitButton}
            style={{ textAlign: "center" }}
          >
            Go to login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // ---- FORM SCREEN (default) ----
  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join op-market in seconds"
      footer={
        <p>
          Already have an account? <Link to="/login">Log in</Link>
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
          <label htmlFor="name" className={styles.label}>
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={nameError ? "true" : "false"}
            aria-describedby={nameError ? "name-error" : undefined}
            className={styles.input}
          />
          {nameError && (
            <p id="name-error" role="alert" className={styles.fieldError}>
              {nameError}
            </p>
          )}
        </div>

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
            aria-invalid={emailError ? "true" : "false"}
            aria-describedby={emailError ? "email-error" : undefined}
            className={styles.input}
          />
          {emailError && (
            <p id="email-error" role="alert" className={styles.fieldError}>
              {emailError}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="password" className={styles.label}>
            Password
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

        <button
          type="submit"
          disabled={isSubmitting}
          className={styles.submitButton}
        >
          {isSubmitting ? "Creating account…" : "Sign up"}
        </button>
      </form>
    </AuthLayout>
  );
}
