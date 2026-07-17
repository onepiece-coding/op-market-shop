/**
 * @file frontend/src/components/shop/address-card/address-card.test.tsx
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import type { Address } from "@/types/address";
import { AddressCard } from ".";

import userEvent from "@testing-library/user-event";

const fakeAddress: Address = {
  id: 1,
  lineOne: "1 Main St",
  lineTwo: null,
  city: "Rabat",
  country: "MA",
  pincode: "10000",
  userId: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  formattedAddress: "1 Main St, Rabat, MA-10000",
};

describe("AddressCard", () => {
  it("renders the formatted address text", () => {
    render(
      <AddressCard
        address={fakeAddress}
        isSelected={false}
        onSelect={() => {}}
      />,
    );
    expect(screen.getByText("1 Main St, Rabat, MA-10000")).toBeInTheDocument();
  });

  it("shows the radio as checked when isSelected is true", () => {
    render(
      <AddressCard address={fakeAddress} isSelected onSelect={() => {}} />,
    );
    expect(screen.getByRole("radio")).toBeChecked();
  });

  it("shows the radio as unchecked when isSelected is false", () => {
    render(
      <AddressCard
        address={fakeAddress}
        isSelected={false}
        onSelect={() => {}}
      />,
    );
    expect(screen.getByRole("radio")).not.toBeChecked();
  });

  it("calls onSelect when clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <AddressCard
        address={fakeAddress}
        isSelected={false}
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByRole("radio"));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
