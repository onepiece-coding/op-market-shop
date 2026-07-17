/**
 * @file frontend/src/pages/auth/LoginPage.tsx
 */

import { useNavigate, useLocation, Link } from "react-router-dom";
import { getFieldError } from "@/utils/getFieldError";
import { useState, type FormEvent } from "react";
import { AuthLayout } from "./AuthLayout";
import { useAuth, usePageMeta } from "@/hooks";

import styles from "./shared.module.css";

// describes the SHAPE of the "state" our ProtectedRoute guard (Part 6-B)
// attaches when it redirects someone here — "from" tells us where they
// were originally headed, so we can send them right back after login
interface LocationState {
  from?: { pathname: string };
}

export function LoginPage() {
  usePageMeta({ title: "Log in" });

  const { login } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // "unknown" because this could be OUR ApiError, a plain Error (from
  // client-side validation below), or technically anything JS can throw
  const [submitError, setSubmitError] = useState<unknown>(null);

  // read the redirect target, falling back to the homepage if there isn't one
  const fromPath =
    (location.state as LocationState | null)?.from?.pathname ?? "/";

  // simple, FAST client-side checks — just for instant feedback.
  // The real, authoritative rules still live in your backend's loginSchema.
  function validate(): string | null {
    if (!email.trim()) return "Email is required.";
    if (!email.includes("@")) return "Please enter a valid email.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    return null; // null means "everything looks fine"
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // stops the browser's default behavior of reloading the whole page
    // on form submit — we want React to handle this instead
    event.preventDefault();
    setSubmitError(null);

    const validationMessage = validate();
    if (validationMessage) {
      setSubmitError(new Error(validationMessage));
      return; // stop here — don't even attempt the network call
    }

    setIsSubmitting(true);
    try {
      await login({ email, password });
      // "replace: true" swaps this login page out of browser history,
      // so pressing Back afterward doesn't bounce the user back to /login
      navigate(fromPath, { replace: true });
    } catch (error) {
      setSubmitError(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  // check for FIELD-SPECIFIC errors first...
  const emailError = getFieldError(submitError, "email");
  const passwordError = getFieldError(submitError, "password");
  // ...and only show a general banner if there's an error, but it did NOT
  // match any specific field (e.g. loginCtrl's plain "Invalid credentials!")
  const generalError =
    !emailError && !passwordError && submitError
      ? submitError instanceof Error
        ? submitError.message
        : "Something went wrong. Please try again."
      : null;

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to your op-market account"
      footer={
        <p>
          Don&apos;t have an account? <Link to="/signup">Sign up</Link>
        </p>
      }
    >
      {/* "noValidate" turns OFF the browser's own built-in validation
          popups, so our OWN custom error messages are the only ones shown —
          keeps the experience consistent across every browser */}
      <form onSubmit={handleSubmit} noValidate className={styles.form}>
        {generalError && (
          // role="alert" tells screen readers to announce this IMMEDIATELY,
          // without the user needing to navigate to find it
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
            // tells assistive technology this field currently has an error
            aria-invalid={emailError ? "true" : "false"}
            // links the input to its error message for screen readers
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
            autoComplete="current-password"
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

        <div className={styles.forgotLink}>
          <Link to="/forgot-password">Forgot your password?</Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={styles.submitButton}
        >
          {isSubmitting ? "Logging in…" : "Log in"}
        </button>
      </form>
    </AuthLayout>
  );
}
