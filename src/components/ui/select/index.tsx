/**
 * @file frontend/src/components/ui/select/index.tsx
 */

import { forwardRef, useId, type SelectHTMLAttributes } from "react";
import { cx } from "@/utils/cx";

import styles from "./styles.module.css";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  error?: string;
  // shown as a disabled, unselectable FIRST option — e.g. "Choose a status"
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    { label, options, error, placeholder, id, className, ...rest },
    ref,
  ) {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const errorId = `${selectId}-error`;

    return (
      <div className={styles.field}>
        <label htmlFor={selectId} className={styles.label}>
          {label}
        </label>
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? errorId : undefined}
          className={cx(styles.select, error && styles.selectError, className)}
          {...rest}
        >
          {placeholder && (
            // "disabled" here means this option can be SHOWN as a hint
            // (e.g. before the user has picked anything) but can never be
            // RE-selected once they've chosen a real option
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={errorId} role="alert" className={styles.fieldError}>
            {error}
          </p>
        )}
      </div>
    );
  },
);
