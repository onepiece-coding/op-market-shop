/**
 * @file frontend/src/components/layout/admin/admin.test.tsx
 */

import { MemoryRouter, Routes, Route } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AdminLayout } from "./index";

import userEvent from "@testing-library/user-event";

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={["/admin/products"]}>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route
            path="/admin/products"
            element={<div>Admin Products Page</div>}
          />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("AdminLayout", () => {
  it("renders the sidebar AND the matched child route content together", () => {
    renderLayout();

    expect(
      screen.getAllByText("op-market admin").length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Admin Products Page")).toBeInTheDocument();
  });

  it("has a link back to the main shop", () => {
    renderLayout();
    expect(screen.getByText("← Back to shop")).toHaveAttribute("href", "/");
  });

  it("opens the mobile sidebar when the menu button is clicked", async () => {
    const user = userEvent.setup();
    renderLayout();

    expect(screen.queryByTestId("sidebar-overlay")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open admin menu" }));

    expect(screen.getByTestId("sidebar-overlay")).toBeInTheDocument();
  });
});
