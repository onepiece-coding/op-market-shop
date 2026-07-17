/**
 * @file frontend/src/components/admin/admin-sidebar/admin-sidebar.test.tsx
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AdminSidebar } from "./index";

import userEvent from "@testing-library/user-event";

function renderSidebar(isMobileOpen = false, onMobileClose = vi.fn()) {
  return render(
    <MemoryRouter initialEntries={["/admin/products"]}>
      <AdminSidebar isMobileOpen={isMobileOpen} onMobileClose={onMobileClose} />
    </MemoryRouter>,
  );
}

describe("AdminSidebar", () => {
  it("renders all four nav items, once for desktop", () => {
    renderSidebar();
    expect(screen.getAllByText("Dashboard").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Products").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Orders").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Users").length).toBeGreaterThanOrEqual(1);
  });

  it("does not render the mobile overlay when isMobileOpen is false", () => {
    renderSidebar(false);
    expect(screen.queryByTestId("sidebar-overlay")).not.toBeInTheDocument();
  });

  it("renders the mobile overlay when isMobileOpen is true", () => {
    renderSidebar(true);
    expect(screen.getByTestId("sidebar-overlay")).toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: "Admin navigation menu" }),
    ).toBeInTheDocument();
  });

  it("calls onMobileClose when the close button is clicked", async () => {
    const user = userEvent.setup();
    const onMobileClose = vi.fn();
    renderSidebar(true, onMobileClose);

    await user.click(screen.getByRole("button", { name: "Close menu" }));

    expect(onMobileClose).toHaveBeenCalledTimes(1);
  });

  it("calls onMobileClose when a nav link inside the mobile panel is clicked", async () => {
    const user = userEvent.setup();
    const onMobileClose = vi.fn();
    renderSidebar(true, onMobileClose);

    // there are TWO "Orders" links (desktop + mobile) — grab the one
    // inside the open mobile dialog specifically
    const dialog = screen.getByRole("dialog");
    const { getByText } = {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      getByText: (_text: string) =>
        dialog.querySelector(`a[href="/admin/orders"]`)!,
    };
    await user.click(getByText("Orders") as HTMLElement);

    expect(onMobileClose).toHaveBeenCalledTimes(1);
  });
});
