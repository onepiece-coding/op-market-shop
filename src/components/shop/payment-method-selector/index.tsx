/**
 * @file frontend/src/components/shop/payment-method-selector/index.tsx
 */

import type { PaymentMethod } from "@/types/order";
import { cx } from "@/utils/cx";

import styles from "./styles.module.css";

export interface PaymentMethodSelectorProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

const OPTIONS: Array<{
  value: PaymentMethod;
  label: string;
  description: string;
}> = [
  {
    value: "CASH_ON_DELIVERY",
    label: "Cash on delivery",
    description: "Pay with cash when your order arrives",
  },
  {
    value: "PAYPAL",
    label: "PayPal",
    description: "Pay securely online via PayPal",
  },
];

// Same native-radio-group pattern as AddressCard (Part 8-E) — sharing
// one "name" attribute across both options gives us correct single-select
// behavior, arrow-key navigation, and screen reader group semantics for
// free, with zero custom JS needed for any of that.
export function PaymentMethodSelector({
  value,
  onChange,
}: PaymentMethodSelectorProps) {
  return (
    <div role="radiogroup" aria-label="Payment method" className={styles.list}>
      {OPTIONS.map((option) => (
        <label
          key={option.value}
          className={cx(styles.card, value === option.value && styles.selected)}
        >
          <input
            type="radio"
            name="paymentMethod"
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className={styles.radio}
          />
          <span className={styles.text}>
            <span className={styles.label}>{option.label}</span>
            <span className={styles.description}>{option.description}</span>
          </span>
        </label>
      ))}
    </div>
  );
}
