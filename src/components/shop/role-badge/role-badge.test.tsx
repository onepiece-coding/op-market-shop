/**
 * @file frontend/src/components/shop/role-badge/role-badge.test.tsx
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { RoleBadge } from ".";

describe("RoleBadge", () => {
  it("shows 'Admin' for the ADMIN role", () => {
    render(<RoleBadge role="ADMIN" />);
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("shows 'User' for the USER role", () => {
    render(<RoleBadge role="USER" />);
    expect(screen.getByText("User")).toBeInTheDocument();
  });
});
