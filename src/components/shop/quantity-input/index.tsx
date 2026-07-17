/**
 * @file frontend/src/components/shop/quantity-input/index.tsx
 */

import { Icon } from "@/components/icons";
import { Button } from "@/components/ui";

import styles from "./styles.module.css";

export interface QuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean; // NEW — lets a caller freeze the control while a mutation is in flight
}

// A small reusable "stepper" control — we'll reuse this again in Part
// 8-D's Cart page for changing an existing cart item's quantity.
export function QuantityInput({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
}: QuantityInputProps) {
  function decrease() {
    onChange(Math.max(min, value - 1));
  }

  function increase() {
    onChange(Math.min(max, value + 1));
  }

  function handleTyped(event: React.ChangeEvent<HTMLInputElement>) {
    const typed = Number(event.target.value);
    // guards against someone typing something non-numeric (which becomes
    // NaN) or a value outside our allowed min/max range
    if (!Number.isFinite(typed)) return;
    onChange(Math.min(max, Math.max(min, typed)));
  }

  return (
    <div className={styles.wrapper} role="group" aria-label="Quantity">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={decrease}
        disabled={disabled || value <= min}
      >
        <Icon name="chevronDown" label="Decrease quantity" />
      </Button>

      <input
        type="number"
        value={value}
        onChange={handleTyped}
        min={min}
        max={max}
        aria-label="Quantity Input"
        className={styles.input}
        disabled={disabled}
      />

      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={increase}
        disabled={disabled || value >= max}
      >
        <Icon name="plus" label="Increase quantity" />
      </Button>
    </div>
  );
}
