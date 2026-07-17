/**
 * @file frontend/src/components/layout/header/header.test.tsx
 */

import { render, screen, waitFor, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { CacheProvider } from "@/cache";
import { Header } from ".";

vi.mock("@/hooks", () => ({
  useAuth: vi.fn(),
}));
vi.mock("@/api/cart", () => ({
  getCart: vi.fn(),
}));

import { getCart } from "@/api/cart";
import { useAuth } from "@/hooks";

function renderHeader() {
  return render(
    <MemoryRouter>
      <CacheProvider>
        <Header />
      </CacheProvider>
    </MemoryRouter>,
  );
}

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows Login/Signup links when logged out, and does NOT fetch the cart", async () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
      user: null,
      logout: vi.fn(),
    });

    renderHeader();

    expect(screen.getByText("Log in")).toBeInTheDocument();
    expect(screen.getByText("Sign up")).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getCart).not.toHaveBeenCalled();
  });

  it("shows the user's name and a Logout link when logged in", () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, name: "Lahcen", role: "USER" },
      logout: vi.fn(),
    });
    (getCart as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    renderHeader();

    expect(screen.getByText("Lahcen")).toBeInTheDocument();
    expect(screen.getByText("Log out")).toBeInTheDocument();
  });

  it("does NOT show the Admin link (in either nav) for a regular USER", () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, name: "Lahcen", role: "USER" },
      logout: vi.fn(),
    });
    (getCart as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    renderHeader();

    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
  });

  it("shows the Admin link in the DESKTOP nav for a user with role ADMIN", () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, name: "Boss", role: "ADMIN" },
      logout: vi.fn(),
    });
    (getCart as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    renderHeader();

    // 🚩 scoped to the desktop nav specifically — "Admin" now legitimately
    // appears TWICE in the full document (once per nav), so a plain
    // getByText("Admin") would fail with "found multiple elements"
    const desktopNav = screen.getByRole("navigation", {
      name: "Main navigation",
    });
    expect(within(desktopNav).getByText("Admin")).toBeInTheDocument();
  });

  it("fetches and displays the real cart item count when authenticated", async () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, name: "Lahcen", role: "USER" },
      logout: vi.fn(),
    });
    (getCart as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 1, quantity: 1 },
      { id: 2, quantity: 3 },
    ]);

    renderHeader();

    await waitFor(() => expect(getCart).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("2")).toBeInTheDocument();
  });

  it("shows no cart badge number when the cart is empty", async () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, name: "Lahcen", role: "USER" },
      logout: vi.fn(),
    });
    (getCart as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    renderHeader();

    await waitFor(() => expect(getCart).toHaveBeenCalledTimes(1));
    expect(screen.getByLabelText("Cart, 0 items")).toBeInTheDocument();
  });

  // ---- NEW: the mobile hamburger menu ----
  describe("mobile menu", () => {
    beforeEach(() => {
      (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: true,
        user: { id: 1, name: "Lahcen", role: "USER" },
        logout: vi.fn(),
      });
      (getCart as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    });

    it("starts closed: aria-expanded is false, and no overlay is present", () => {
      renderHeader();

      expect(screen.getByRole("button", { name: "Open menu" })).toHaveAttribute(
        "aria-expanded",
        "false",
      );
      expect(
        screen.queryByTestId("mobile-nav-overlay"),
      ).not.toBeInTheDocument();
    });

    it("clicking the toggle opens the menu: shows the overlay and flips aria-expanded", async () => {
      const user = userEvent.setup();
      renderHeader();

      await user.click(screen.getByRole("button", { name: "Open menu" }));

      expect(screen.getByTestId("mobile-nav-overlay")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Close menu" }),
      ).toHaveAttribute("aria-expanded", "true");
    });

    it("clicking the overlay closes the menu", async () => {
      const user = userEvent.setup();
      renderHeader();

      await user.click(screen.getByRole("button", { name: "Open menu" }));
      await user.click(screen.getByTestId("mobile-nav-overlay"));

      expect(
        screen.queryByTestId("mobile-nav-overlay"),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Open menu" })).toHaveAttribute(
        "aria-expanded",
        "false",
      );
    });

    it("the mobile nav contains the SAME links as the desktop nav", async () => {
      const user = userEvent.setup();
      renderHeader();

      await user.click(screen.getByRole("button", { name: "Open menu" }));

      const mobileNav = screen.getByRole("navigation", {
        name: "Mobile navigation",
      });
      expect(within(mobileNav).getByText("Shop")).toBeInTheDocument();
      expect(within(mobileNav).getByText("My Orders")).toBeInTheDocument();
    });

    it("clicking a link inside the mobile nav closes the menu (auto-close on route change)", async () => {
      const user = userEvent.setup();
      renderHeader();

      await user.click(screen.getByRole("button", { name: "Open menu" }));
      const mobileNav = screen.getByRole("navigation", {
        name: "Mobile navigation",
      });

      await user.click(within(mobileNav).getByText("My Orders"));

      expect(
        screen.queryByTestId("mobile-nav-overlay"),
      ).not.toBeInTheDocument();
    });
  });
});
