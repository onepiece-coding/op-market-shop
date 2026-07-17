/**
 * @file frontend/src/routes/AdminRoute.test.tsx
 */

import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminRoute } from "./AdminRoute";

vi.mock("@/hooks", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "@/hooks";

function renderWithRouter(initialPath = "/admin/products") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/" element={<div>Home Page</div>} />
        <Route element={<AdminRoute />}>
          <Route
            path="/admin/products"
            element={<div>Admin Products Page</div>}
          />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("AdminRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a loading state while auth is still initializing", () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isInitializing: true,
    });

    renderWithRouter();

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("redirects to /login when not authenticated at all", () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isInitializing: false,
    });

    renderWithRouter();

    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("redirects to / when logged in but role is USER, not ADMIN", () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: 1, role: "USER" },
      isAuthenticated: true,
      isInitializing: false,
    });

    renderWithRouter();

    expect(screen.getByText("Home Page")).toBeInTheDocument();
    expect(screen.queryByText("Admin Products Page")).not.toBeInTheDocument();
  });

  it("renders the admin page when the user IS an ADMIN", () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: 1, role: "ADMIN" },
      isAuthenticated: true,
      isInitializing: false,
    });

    renderWithRouter();

    expect(screen.getByText("Admin Products Page")).toBeInTheDocument();
  });
});
