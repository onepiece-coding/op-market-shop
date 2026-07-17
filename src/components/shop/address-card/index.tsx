/**
 * @file frontend/src/components/shop/address-card/index.tsx
 */

import type { Address } from "@/types/address";
import { cx } from "@/utils/cx";

import styles from "./styles.module.css";

export interface AddressCardProps {
  address: Address;
  isSelected: boolean;
  onSelect: () => void;
}

// A single selectable radio "card" for one saved address. Every
// AddressCard rendered together shares the SAME radio "name" attribute,
// so the browser enforces "exactly one selected" for free — normal
// native <input type="radio"> group behavior, no extra JS needed for it.
export function AddressCard({
  address,
  isSelected,
  onSelect,
}: AddressCardProps) {
  return (
    <label className={cx(styles.card, isSelected && styles.selected)}>
      <input
        type="radio"
        name="shippingAddress"
        checked={isSelected}
        onChange={onSelect}
        className={styles.radio}
      />
      <span className={styles.text}>{address.formattedAddress}</span>
    </label>
  );
}
