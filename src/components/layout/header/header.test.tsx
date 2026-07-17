/**
 * @file frontend/src/components/layout/header/header.test.tsx
 */

import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
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
    // give any potential fetch a moment, then confirm it truly never fired —
    // this is the "enabled: isAuthenticated" guard from our "why" section
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

  it("does NOT show the Admin link for a regular USER", () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, name: "Lahcen", role: "USER" },
      logout: vi.fn(),
    });
    (getCart as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    renderHeader();

    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
  });

  it("shows the Admin link for a user with role ADMIN", () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, name: "Boss", role: "ADMIN" },
      logout: vi.fn(),
    });
    (getCart as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    renderHeader();

    expect(screen.getByText("Admin")).toBeInTheDocument();
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
    expect(await screen.findByText("2")).toBeInTheDocument(); // 2 cart ITEMS (rows), not quantities
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
    // aria-label always reflects the real count, even when 0 — this
    // confirms the badge NUMBER (a separate visual element) is hidden,
    // while the accessible name stays accurate
    expect(screen.getByLabelText("Cart, 0 items")).toBeInTheDocument();
  });
});
