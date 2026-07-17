/**
 * @file frontend/src/components/ui/spinner/index.tsx
 */

import { cx } from "@/utils/cx";

import styles from "./styles.module.css";

export type SpinnerSize = "sm" | "md" | "lg";

export interface SpinnerProps {
  size?: SpinnerSize;
  // the text announced to screen reader users — sighted users never see
  // this text directly, but it's essential for anyone using a screen reader
  label?: string;
  className?: string;
}

export function Spinner({
  size = "md",
  label = "Loading",
  className,
}: SpinnerProps) {
  return (
    // role="status" tells assistive technology "this is a live status
    // update area" — screen readers will announce its text content
    // automatically, without the user needing to navigate to find it
    <span role="status" className={cx(styles.wrapper, className)}>
      <svg
        className={cx(styles.svg, styles[size])}
        viewBox="0 0 50 50"
        xmlns="http://www.w3.org/2000/svg"
        // the spinning circle graphic itself carries NO meaning on its
        // own — the real information is the text below, so we hide the
        // SVG from screen readers entirely to avoid a confusing, silent
        // "image" announcement with no useful description
        aria-hidden="true"
      >
        {/* the pale background circle - always fully visible */}
        <circle
          className={styles.track}
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="5"
        />
        {/* the colored arc that visually appears to "spin" via CSS animation */}
        <circle
          className={styles.indicator}
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="5"
        />
      </svg>
      {/* "sr-only" is our global utility class from Part 1-C's global.css —
          it hides this text VISUALLY, but screen readers still read it */}
      <span className="sr-only">{label}</span>
    </span>
  );
}
