/**
 * @file frontend/src/components/shop/status-badge/index.tsx
 */

import type { OrderEventStatus } from "@/types/order";
import { cx } from "@/utils/cx";

import styles from "./styles.module.css";

export interface StatusBadgeProps {
  status: OrderEventStatus;
}

// human-readable labels + which color token each status maps to. Pulling
// this into one lookup table keeps the component's JSX itself trivial,
// and makes adding a new status later a one-line change here, not a
// hunt through scattered conditional styling.
const STATUS_CONFIG: Record<
  OrderEventStatus,
  { label: string; className: string }
> = {
  PENDING: { label: "Pending", className: styles.pending },
  ACCEPTED: { label: "Accepted", className: styles.accepted },
  OUT_FOR_DELIVERY: {
    label: "Out for delivery",
    className: styles.outForDelivery,
  },
  DELIVERED: { label: "Delivered", className: styles.delivered },
  CANCELED: { label: "Canceled", className: styles.canceled },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span className={cx(styles.badge, config.className)}>{config.label}</span>
  );
}
