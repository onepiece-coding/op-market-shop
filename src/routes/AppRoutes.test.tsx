/**
 * @file frontend/src/routes/AppRoutes.test.tsx
 */

import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "@/context/auth";
import { CacheProvider } from "@/cache";
import { AppRoutes } from "./AppRoutes";

import userEvent from "@testing-library/user-event";

// We mock ONLY the real network boundary — every provider, guard, and
// page component above this is 100% real, exactly as it runs in the browser.
vi.mock("@/api/auth", () => ({
  getMe: vi.fn(),
  login: vi.fn(),
  signUp: vi.fn(),
  logout: vi.fn(),
  verifyEmail: vi.fn(),
  resendVerification: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
}));

import { getMe, login } from "@/api/auth";

// wraps AppRoutes with the SAME provider stack App.tsx uses, minus
// BrowserRouter (MemoryRouter lets our test control the starting URL)
function renderApp(initialPath = "/") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <CacheProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </CacheProvider>
    </MemoryRouter>,
  );
}

describe.skip("AppRoutes (integration)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the HomePage at '/'", async () => {
    (getMe as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Unauthorized!"),
    );

    renderApp("/");

    expect(
      await screen.findByText("Welcome to op-market 🏴‍☠️"),
    ).toBeInTheDocument();
  });

  it("shows Login/Signup links on the homepage when logged out", async () => {
    (getMe as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Unauthorized!"),
    );

    renderApp("/");

    await waitFor(() => expect(screen.getByText("Log in")).toBeInTheDocument());
    expect(screen.getByText("Sign up")).toBeInTheDocument();
  });

  it("shows the user's name and a Logout button on the homepage when logged in", async () => {
    (getMe as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      name: "Lahcen",
      role: "USER",
    });

    renderApp("/");

    expect(await screen.findByText("Hi, Lahcen")).toBeInTheDocument();
    expect(screen.getByText("Log out")).toBeInTheDocument();
  });

  it("renders the 404 page for a completely unknown url", async () => {
    (getMe as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Unauthorized!"),
    );

    renderApp("/this-page-does-not-exist");

    expect(await screen.findByText("404 — Page not found")).toBeInTheDocument();
  });

  it("redirects an unauthenticated visitor from a PROTECTED page straight to Login", async () => {
    (getMe as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Unauthorized!"),
    );

    renderApp("/cart");

    // briefly shows the ProtectedRoute loading state, then resolves to /login
    expect(await screen.findByLabelText("Email")).toBeInTheDocument(); // LoginPage's field
    expect(screen.queryByText("Cart")).not.toBeInTheDocument();
  });

  it("shows the real protected page once the visitor IS authenticated", async () => {
    (getMe as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      name: "Lahcen",
      role: "USER",
    });

    renderApp("/cart");

    expect(await screen.findByText("Cart")).toBeInTheDocument();
    expect(
      screen.getByText("🚧 This page is coming soon."),
    ).toBeInTheDocument();
  });

  it("redirects a logged-in NON-admin away from an admin page, back to home", async () => {
    (getMe as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      name: "Lahcen",
      role: "USER",
    });

    renderApp("/admin/products");

    expect(
      await screen.findByText("Welcome to op-market 🏴‍☠️"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Admin Products")).not.toBeInTheDocument();
  });

  it("shows the real admin page for a logged-in ADMIN", async () => {
    (getMe as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      name: "Boss",
      role: "ADMIN",
    });

    renderApp("/admin/products");

    expect(await screen.findByText("Admin Products")).toBeInTheDocument();
  });

  // ---- THE FULL END-TO-END FLOW: logged out -> click Login link ----
  // ---- -> submit real form -> AuthContext updates -> homepage reflects it ----
  it("lets a logged-out visitor navigate to Login, submit the form, and see themselves logged in", async () => {
    const user = userEvent.setup();
    (getMe as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Unauthorized!"),
    );
    (login as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: 1, name: "Lahcen", role: "USER" },
    });

    renderApp("/");

    await waitFor(() => expect(screen.getByText("Log in")).toBeInTheDocument());
    await user.click(screen.getByText("Log in"));

    // this is the REAL LoginPage, reached via REAL react-router navigation
    expect(await screen.findByLabelText("Email")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Email"), "lahcen@test.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    // login() succeeded -> navigate("/") -> HomePage re-reads REAL AuthContext
    expect(await screen.findByText("Hi, Lahcen")).toBeInTheDocument();
  });
});
