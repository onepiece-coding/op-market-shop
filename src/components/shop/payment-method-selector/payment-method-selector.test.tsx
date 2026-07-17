/**
 * @file frontend/src/components/shop/payment-method-selector/payment-method-selector.test.tsx
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { PaymentMethodSelector } from ".";

describe("PaymentMethodSelector", () => {
  it("renders both payment method options", () => {
    render(
      <PaymentMethodSelector value="CASH_ON_DELIVERY" onChange={() => {}} />,
    );
    expect(screen.getByText("Cash on delivery")).toBeInTheDocument();
    expect(screen.getByText("PayPal")).toBeInTheDocument();
  });

  it("marks the current value's radio as checked, and the other as unchecked", () => {
    render(<PaymentMethodSelector value="PAYPAL" onChange={() => {}} />);
    expect(screen.getByRole("radio", { name: /PayPal/ })).toBeChecked();
    expect(
      screen.getByRole("radio", { name: /Cash on delivery/ }),
    ).not.toBeChecked();
  });

  it("calls onChange with the newly selected method", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <PaymentMethodSelector value="CASH_ON_DELIVERY" onChange={onChange} />,
    );

    await user.click(screen.getByRole("radio", { name: /PayPal/ }));

    expect(onChange).toHaveBeenCalledWith("PAYPAL");
  });
});
