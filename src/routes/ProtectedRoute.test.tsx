/**
 * @file frontend/src/routes/ProtectedRoute.test.tsx
 */

import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProtectedRoute } from "./ProtectedRoute";

// We fake the ENTIRE AuthContext module — same technique as Part 6-A's
// own test file — so we can directly control exactly what useAuth()
// returns in each test, without needing a real login flow.
vi.mock("@/hooks", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "@/hooks";

// This builds a tiny, realistic mini-router: a public /login page, plus
// ONE protected page (/cart) sitting behind our real ProtectedRoute —
// exactly the shape our real app will use starting in Part 8.
function renderWithRouter(initialPath = "/cart") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/cart" element={<div>Cart Page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a loading state while auth is still initializing", () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
      isInitializing: true,
    });

    renderWithRouter();

    // "role=status" is how we labeled our loading placeholder
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("Cart Page")).not.toBeInTheDocument();
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });

  it("redirects to /login when the user is not authenticated", () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
      isInitializing: false,
    });

    renderWithRouter();

    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Cart Page")).not.toBeInTheDocument();
  });

  it("renders the protected page when the user IS authenticated", () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
      isInitializing: false,
    });

    renderWithRouter();

    expect(screen.getByText("Cart Page")).toBeInTheDocument();
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });
});
