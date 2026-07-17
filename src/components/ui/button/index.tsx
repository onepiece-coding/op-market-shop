/**
 * @file frontend/src/components/ui/button/index.tsx
 */

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Spinner } from "../spinner";
import { cx } from "@/utils/cx";

import styles from "./styles.module.css";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

// "extends ButtonHTMLAttributes<HTMLButtonElement>" means our Button
// automatically accepts EVERY normal prop a real <button> accepts too
// (onClick, disabled, aria-label, etc.) — we don't need to re-list them.
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean; // shows a spinner AND disables the button
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      fullWidth = false,
      disabled,
      children,
      className,
      type = "button",
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        // disabled while loading too — stops a user from double-submitting
        // by clicking again while the first request is still in flight
        disabled={disabled || isLoading}
        // tells assistive tech "this button is busy right now" — screen
        // readers announce this state change automatically
        aria-busy={isLoading || undefined}
        className={cx(
          styles.button,
          styles[variant],
          styles[size],
          fullWidth && styles.fullWidth,
          className,
        )}
        {...rest}
      >
        {isLoading && <Spinner size="sm" />}
        {children}
      </button>
    );
  },
);
