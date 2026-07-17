/**
 * @file frontend/src/pages/auth/ResetPasswordPage.test.tsx
 */

import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ResetPasswordPage } from "./ResetPasswordPage";
import { ApiError } from "@/api/ApiError";

import userEvent from "@testing-library/user-event";

vi.mock("@/api/auth", () => ({
  resetPassword: vi.fn(),
}));

import { resetPassword } from "@/api/auth";

function renderPage(path = "/reset-password?token=abc123") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/login" element={<div>Login Page</div>} />
        <Route
          path="/forgot-password"
          element={<div>Forgot Password Page</div>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows an 'invalid link' message and no form when the URL has no token", () => {
    renderPage("/reset-password"); // no "?token=..." at all

    expect(screen.getByText("Invalid reset link")).toBeInTheDocument();
    expect(screen.queryByLabelText("New password")).not.toBeInTheDocument();
    expect(screen.getByText("Request a new reset link")).toBeInTheDocument();
  });

  it("renders new password and confirm password fields when a token IS present", () => {
    renderPage();

    expect(screen.getByLabelText("New password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm new password")).toBeInTheDocument();
  });

  it("shows a validation error and does not call resetPassword when the password is too short", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText("New password"), "abc");
    await user.type(screen.getByLabelText("Confirm new password"), "abc");
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Password must be at least 6 characters.",
    );
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it("shows a validation error and does not call resetPassword when the passwords don't match", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText("New password"), "secret123");
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "different456",
    );
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Passwords do not match.",
    );
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it("calls resetPassword with the token from the URL and the new password", async () => {
    const user = userEvent.setup();
    (resetPassword as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: 1, name: "Lahcen" },
      message: "Password reset successfully. Please log in again.",
    });

    renderPage("/reset-password?token=real-token-456");

    await user.type(screen.getByLabelText("New password"), "newSecret123");
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "newSecret123",
    );
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    await waitFor(() =>
      expect(resetPassword).toHaveBeenCalledWith({
        token: "real-token-456",
        password: "newSecret123",
      }),
    );
  });

  it("shows a success screen (NOT auto-login) after a successful reset", async () => {
    const user = userEvent.setup();
    (resetPassword as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: 1, name: "Lahcen" },
      message: "Password reset successfully. Please log in again.",
    });

    renderPage();

    await user.type(screen.getByLabelText("New password"), "newSecret123");
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "newSecret123",
    );
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    // 🚩 confirms the key backend behavior: we land on a "please log in
    // again" screen, NOT automatically inside the app
    expect(await screen.findByText("Password reset 🎉")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your password has been reset successfully. Please log in again.",
      ),
    ).toBeInTheDocument();
  });

  it("clicking 'Go to login' after success navigates to the Login page", async () => {
    const user = userEvent.setup();
    (resetPassword as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: 1, name: "Lahcen" },
      message: "Password reset successfully. Please log in again.",
    });

    renderPage();

    await user.type(screen.getByLabelText("New password"), "newSecret123");
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "newSecret123",
    );
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    const goToLoginButton = await screen.findByRole("button", {
      name: "Go to login",
    });
    await user.click(goToLoginButton);

    expect(await screen.findByText("Login Page")).toBeInTheDocument();
  });

  it("shows the backend's error message when the token is invalid or expired", async () => {
    const user = userEvent.setup();
    (resetPassword as ReturnType<typeof vi.fn>).mockRejectedValue(
      new ApiError("Invalid or expired reset token", 400),
    );

    renderPage();

    await user.type(screen.getByLabelText("New password"), "newSecret123");
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "newSecret123",
    );
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid or expired reset token",
    );
    // the form should still be visible — this genuinely failed
    expect(screen.getByLabelText("New password")).toBeInTheDocument();
  });
});
