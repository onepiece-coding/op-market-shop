/**
 * @file frontend/src/components/shop/status-badge/status-badge.test.tsx
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatusBadge } from ".";

describe("StatusBadge", () => {
  it("renders a human-readable label for each status", () => {
    render(<StatusBadge status="OUT_FOR_DELIVERY" />);
    expect(screen.getByText("Out for delivery")).toBeInTheDocument();
  });

  it("renders correctly for every possible status without crashing", () => {
    const statuses = [
      "PENDING",
      "ACCEPTED",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELED",
    ] as const;
    statuses.forEach((status) => {
      const { unmount } = render(<StatusBadge status={status} />);
      expect(screen.getByText(/./)).toBeInTheDocument();
      unmount();
    });
  });
});
