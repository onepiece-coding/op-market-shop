/**
 * @file frontend/src/pages/auth/SignupPage.test.tsx
 */

import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SignupPage } from "./SignupPage";
import { ApiError } from "@/api/ApiError";

import userEvent from "@testing-library/user-event";

vi.mock("@/hooks", () => ({
  usePageMeta: vi.fn(),
  useAuth: vi.fn(),
}));

import { useAuth } from "@/hooks";

function renderSignupPage() {
  return render(
    <MemoryRouter initialEntries={["/signup"]}>
      <Routes>
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("SignupPage", () => {
  const signUpMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      signUp: signUpMock,
    });
  });

  it("renders name, email, and password fields", () => {
    renderSignupPage();

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("shows a validation error and does not call signUp() when the name is empty", async () => {
    const user = userEvent.setup();
    renderSignupPage();

    await user.type(screen.getByLabelText("Email"), "lahcen@test.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Sign up" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Name is required.",
    );
    expect(signUpMock).not.toHaveBeenCalled();
  });

  it("calls signUp() with the typed values", async () => {
    const user = userEvent.setup();
    signUpMock.mockResolvedValue({
      user: { id: 1, name: "Lahcen" },
      verificationEmailSent: true,
      message: "Account created. Please verify your email.",
    });

    renderSignupPage();

    await user.type(screen.getByLabelText("Name"), "Lahcen");
    await user.type(screen.getByLabelText("Email"), "lahcen@test.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Sign up" }));

    await waitFor(() =>
      expect(signUpMock).toHaveBeenCalledWith({
        name: "Lahcen",
        email: "lahcen@test.com",
        password: "secret123",
      }),
    );
  });

  it("shows the success screen with the backend's message after a successful signup", async () => {
    const user = userEvent.setup();
    signUpMock.mockResolvedValue({
      user: { id: 1, name: "Lahcen" },
      verificationEmailSent: true,
      message: "Account created. Please verify your email.",
    });

    renderSignupPage();

    await user.type(screen.getByLabelText("Name"), "Lahcen");
    await user.type(screen.getByLabelText("Email"), "lahcen@test.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Sign up" }));

    expect(await screen.findByText("Check your email")).toBeInTheDocument();
    expect(
      screen.getByText("Account created. Please verify your email."),
    ).toBeInTheDocument();
    // confirms the "we sent a link" version shows when verificationEmailSent is true
    expect(screen.getByText(/We sent a verification link/)).toBeInTheDocument();
    // and the form itself should be GONE — replaced entirely by the success view
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
  });

  it("shows a different message on the success screen when the verification email failed to send", async () => {
    const user = userEvent.setup();
    signUpMock.mockResolvedValue({
      user: { id: 1, name: "Lahcen" },
      verificationEmailSent: false, // 🚩 the real edge case from signUpCtrl
      message:
        "Account created, but the verification email could not be sent. Please request a new one.",
    });

    renderSignupPage();

    await user.type(screen.getByLabelText("Name"), "Lahcen");
    await user.type(screen.getByLabelText("Email"), "lahcen@test.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Sign up" }));

    expect(
      await screen.findByText(/couldn't send the verification email/),
    ).toBeInTheDocument();
    // the "we sent a link" version must NOT show in this case
    expect(
      screen.queryByText(/We sent a verification link/),
    ).not.toBeInTheDocument();
  });

  it("shows a general error banner when signup fails (e.g. email already exists)", async () => {
    const user = userEvent.setup();
    signUpMock.mockRejectedValue(new ApiError("User already exists!", 400));

    renderSignupPage();

    await user.type(screen.getByLabelText("Name"), "Lahcen");
    await user.type(screen.getByLabelText("Email"), "existing@test.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Sign up" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "User already exists!",
    );
    // the form should still be visible — signup genuinely failed, no success screen
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
  });

  it("has a link back to the Login page", () => {
    renderSignupPage();
    expect(screen.getByText("Log in")).toBeInTheDocument();
  });
});
