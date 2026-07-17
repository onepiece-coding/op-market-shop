/**
 * @file frontend/src/components/ui/input/index.tsx
 */

import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cx } from "@/utils/cx";

import styles from "./styles.module.css";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string; // REQUIRED — every input must have a visible, connected label
  error?: string;
  helperText?: string; // e.g. "Must be at least 6 characters"
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, helperText, id, className, ...rest },
  ref,
) {
  // if the caller gave us an explicit id, use theirs — otherwise, generate
  // a guaranteed-unique one ourselves
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  // aria-describedby can point to MULTIPLE element ids at once, separated
  // by spaces — we build that list dynamically, including only whichever
  // of "error" / "helperText" is actually present right now
  const describedBy = [error && errorId, helperText && !error && helperId]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.field}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={describedBy || undefined}
        className={cx(styles.input, error && styles.inputError, className)}
        {...rest}
      />
      {/* helper text and error message are mutually exclusive — showing
          BOTH at once would be visually noisy and, more importantly,
          confusing for a screen reader user hearing both read aloud */}
      {helperText && !error && (
        <p id={helperId} className={styles.helperText}>
          {helperText}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className={styles.fieldError}>
          {error}
        </p>
      )}
    </div>
  );
});
