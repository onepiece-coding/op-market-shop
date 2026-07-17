/**
 * @file frontend/src/components/shop/quantity-input/quantity-input.test.tsx
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { QuantityInput } from ".";

import userEvent from "@testing-library/user-event";

describe("QuantityInput", () => {
  it("calls onChange with value+1 when the increase button is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<QuantityInput value={3} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Increase quantity" }));

    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("calls onChange with value-1 when the decrease button is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<QuantityInput value={3} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Decrease quantity" }));

    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("disables the decrease button once at the minimum", () => {
    render(<QuantityInput value={1} onChange={() => {}} min={1} />);
    expect(
      screen.getByRole("button", { name: "Decrease quantity" }),
    ).toBeDisabled();
  });

  it("disables the increase button once at the maximum", () => {
    render(<QuantityInput value={5} onChange={() => {}} max={5} />);
    expect(
      screen.getByRole("button", { name: "Increase quantity" }),
    ).toBeDisabled();
  });

  it("disables all controls when disabled is true, regardless of min/max", () => {
    render(<QuantityInput value={3} onChange={() => {}} disabled />);

    expect(
      screen.getByRole("button", { name: "Decrease quantity" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Increase quantity" }),
    ).toBeDisabled();
    expect(screen.getByLabelText("Quantity Input")).toBeDisabled();
  });
});
