/**
 * @file frontend/src/pages/auth/ForgotPasswordPage.test.tsx
 */

import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ForgotPasswordPage } from "./ForgotPasswordPage";
import { ApiError } from "@/api/ApiError";

import userEvent from "@testing-library/user-event";

// same technique as ResendVerificationPage's test (Part 6-C-3) — this page
// calls the API function directly, no AuthContext involved at all
vi.mock("@/api/auth", () => ({
  forgotPassword: vi.fn(),
}));

import { forgotPassword } from "@/api/auth";

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/forgot-password"]}>
      <Routes>
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders an email field and a submit button", () => {
    renderPage();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send reset link" }),
    ).toBeInTheDocument();
  });

  it("shows a validation error and does not call forgotPassword when email is empty", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Email is required.",
    );
    expect(forgotPassword).not.toHaveBeenCalled();
  });

  it("calls forgotPassword with the typed email", async () => {
    const user = userEvent.setup();
    (forgotPassword as ReturnType<typeof vi.fn>).mockResolvedValue({
      message: "If the email exists, a password reset link has been sent.",
    });

    renderPage();

    await user.type(screen.getByLabelText("Email"), "lahcen@test.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() =>
      expect(forgotPassword).toHaveBeenCalledWith({ email: "lahcen@test.com" }),
    );
  });

  it("shows the SAME generic success screen regardless of whether the email is real (mirrors backend privacy behavior)", async () => {
    const user = userEvent.setup();
    (forgotPassword as ReturnType<typeof vi.fn>).mockResolvedValue({
      message: "If the email exists, a password reset link has been sent.",
    });

    renderPage();

    await user.type(
      screen.getByLabelText("Email"),
      "not-a-real-account@test.com",
    );
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByText("Check your email")).toBeInTheDocument();
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
  });

  it("shows a general error banner on a genuine failure", async () => {
    const user = userEvent.setup();
    (forgotPassword as ReturnType<typeof vi.fn>).mockRejectedValue(
      new ApiError("Internal Server Error", 500),
    );

    renderPage();

    await user.type(screen.getByLabelText("Email"), "lahcen@test.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Internal Server Error",
    );
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("has a link back to the Login page", () => {
    renderPage();
    expect(screen.getByText("Log in")).toBeInTheDocument();
  });
});
