/**
 * @file frontend/src/pages/auth/LoginPage.test.tsx
 */

import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiError } from "@/api/ApiError";
import { LoginPage } from "./LoginPage";

import userEvent from "@testing-library/user-event";

// same technique as our Part 6-B route guard tests — fully fake the
// AuthContext module so we control exactly what login() does, without
// needing a real backend or a real AuthProvider wrapping our test
vi.mock("@/hooks", () => ({
  usePageMeta: vi.fn(),
  useAuth: vi.fn(),
}));

import { useAuth } from "@/hooks";

// a small helper so every test doesn't have to repeat this router setup.
// "initialEntry" lets us simulate arriving here WITH or WITHOUT a
// "from" redirect state, exactly like ProtectedRoute would set it.
function renderLoginPage(
  initialEntry: { pathname: string; state?: unknown } = { pathname: "/login" },
) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<div>Home Page</div>} />
        <Route path="/cart" element={<div>Cart Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("LoginPage", () => {
  const loginMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ login: loginMock });
  });

  it("renders the email field, password field, and submit button", () => {
    renderLoginPage();

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log in" })).toBeInTheDocument();
  });

  it("shows a validation message and does NOT call login() when the form is empty", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Email is required.",
    );
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("calls login() with the typed values, then navigates to '/' when there's no redirect target", async () => {
    const user = userEvent.setup();
    loginMock.mockResolvedValue({ user: { id: 1, name: "Lahcen" } });

    renderLoginPage();

    await user.type(screen.getByLabelText("Email"), "lahcen@test.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() =>
      expect(loginMock).toHaveBeenCalledWith({
        email: "lahcen@test.com",
        password: "secret123",
      }),
    );

    expect(await screen.findByText("Home Page")).toBeInTheDocument();
  });

  it("redirects back to the page the user was ORIGINALLY trying to reach", async () => {
    const user = userEvent.setup();
    loginMock.mockResolvedValue({ user: { id: 1, name: "Lahcen" } });

    // this mimics exactly what ProtectedRoute (Part 6-B) sets on redirect
    renderLoginPage({
      pathname: "/login",
      state: { from: { pathname: "/cart" } },
    });

    await user.type(screen.getByLabelText("Email"), "lahcen@test.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Cart Page")).toBeInTheDocument();
  });

  it("shows a general error banner when login fails with no field-specific detail", async () => {
    const user = userEvent.setup();
    // matches EXACTLY how loginCtrl fails on wrong credentials — no "errors" array
    loginMock.mockRejectedValue(new ApiError("Invalid credentials!", 400));

    renderLoginPage();

    await user.type(screen.getByLabelText("Email"), "lahcen@test.com");
    await user.type(screen.getByLabelText("Password"), "wrongpass");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid credentials!",
    );
  });

  it("disables the submit button while the login request is in flight", async () => {
    const user = userEvent.setup();
    // a promise we control by hand, so we can inspect the "in progress"
    // state BEFORE letting it resolve
    let resolveLogin: (value: unknown) => void = () => {};
    loginMock.mockReturnValue(
      new Promise((resolve) => {
        resolveLogin = resolve;
      }),
    );

    renderLoginPage();

    await user.type(screen.getByLabelText("Email"), "lahcen@test.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(screen.getByRole("button", { name: "Logging in…" })).toBeDisabled();

    // let the promise resolve so it doesn't leak into any test that runs after this one
    resolveLogin({ user: { id: 1 } });
    await waitFor(() => expect(loginMock).toHaveBeenCalled());
  });
});
