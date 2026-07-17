/**
 * @file frontend/src/components/icons/Icon.tsx
 */

import { iconPaths, type IconName } from "./iconPaths";
import { cx } from "@/utils";

import styles from "./Icon.module.css";

export interface IconProps {
  name: IconName; // TypeScript will only allow real, existing icon names here
  size?: number; // in pixels — applies to both width AND height, icons are always square
  color?: string; // defaults to "currentColor"
  // if given, this icon is treated as MEANINGFUL on its own (gets
  // role="img" + aria-label). If left out, the icon is treated as purely
  // DECORATIVE (gets aria-hidden="true") — see the accessibility
  label?: string;
  className?: string;
}

export function Icon({
  name,
  size = 20,
  color = "currentColor",
  label,
  className,
}: IconProps) {
  const pathData = iconPaths[name];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24" // matches the 24x24 grid every path in iconPaths.ts was drawn on
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round" // rounds the ENDS of each line segment — softer, friendlier look
      strokeLinejoin="round" // rounds the CORNERS where two line segments meet
      className={cx(styles.icon, className)}
      // this ternary is the ENTIRE accessibility decision described above,
      // enforced automatically every single time Icon is used anywhere
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : "true"}
    >
      <path d={pathData} />
    </svg>
  );
}
