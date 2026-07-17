/**
 * @file frontend/src/components/layout/main/main.test.tsx
 */

import { MemoryRouter, Routes, Route } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CacheProvider } from "@/cache";
import { MainLayout } from ".";

vi.mock("@/hooks", () => ({
  useFocusMainOnRouteChange: vi.fn(),
  useAuth: vi.fn(),
}));
vi.mock("@/api/cart", () => ({
  getCart: vi.fn(),
}));

import { useAuth } from "@/hooks";

describe("MainLayout", () => {
  it("renders the Header, Footer, AND the matched child route's content together", () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
      user: null,
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <CacheProvider>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<div>Real Page Content</div>} />
            </Route>
          </Routes>
        </CacheProvider>
      </MemoryRouter>,
    );

    // Header content
    expect(screen.getByLabelText("Main navigation")).toBeInTheDocument();
    // the actual page, rendered through <Outlet />
    expect(screen.getByText("Real Page Content")).toBeInTheDocument();
    // Footer content
    expect(screen.getByText(/All rights reserved/)).toBeInTheDocument();
  });

  it("renders a SkipLink pointing at the main content region", () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
      user: null,
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <CacheProvider>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<div>Page</div>} />
            </Route>
          </Routes>
        </CacheProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText("Skip to main content")).toHaveAttribute(
      "href",
      "#main-content",
    );
    expect(document.getElementById("main-content")).toBeInTheDocument();
  });
});
