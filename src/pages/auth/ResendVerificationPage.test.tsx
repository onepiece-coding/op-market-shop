/**
 * @file frontend/src/pages/auth/ResendVerificationPage.test.tsx
 */

import { ResendVerificationPage } from "./ResendVerificationPage";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiError } from "@/api/ApiError";

import userEvent from "@testing-library/user-event";

// same technique as our other API-function tests (Part 3-C) — mock the
// WHOLE @/api/auth module, since this page calls resendVerification directly
// (it doesn't need AuthContext at all, since resending doesn't log anyone in)
vi.mock("@/api/auth", () => ({
  resendVerification: vi.fn(),
}));

import { resendVerification } from "@/api/auth";

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/resend-verification"]}>
      <Routes>
        <Route
          path="/resend-verification"
          element={<ResendVerificationPage />}
        />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ResendVerificationPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders an email field and a submit button", () => {
    renderPage();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send verification link" }),
    ).toBeInTheDocument();
  });

  it("shows a validation error and does not call resendVerification when email is empty", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      screen.getByRole("button", { name: "Send verification link" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Email is required.",
    );
    expect(resendVerification).not.toHaveBeenCalled();
  });

  it("calls resendVerification with the typed email", async () => {
    const user = userEvent.setup();
    (resendVerification as ReturnType<typeof vi.fn>).mockResolvedValue({
      message:
        "If the email exists and is not verified, a verification email has been sent.",
    });

    renderPage();

    await user.type(screen.getByLabelText("Email"), "lahcen@test.com");
    await user.click(
      screen.getByRole("button", { name: "Send verification link" }),
    );

    await waitFor(() =>
      expect(resendVerification).toHaveBeenCalledWith({
        email: "lahcen@test.com",
      }),
    );
  });

  it("shows the SAME generic success screen, regardless of whether the email is real (mirrors backend privacy behavior)", async () => {
    const user = userEvent.setup();
    (resendVerification as ReturnType<typeof vi.fn>).mockResolvedValue({
      message:
        "If the email exists and is not verified, a verification email has been sent.",
    });

    renderPage();

    await user.type(
      screen.getByLabelText("Email"),
      "definitely-not-a-real-email@test.com",
    );
    await user.click(
      screen.getByRole("button", { name: "Send verification link" }),
    );

    expect(await screen.findByText("Check your email")).toBeInTheDocument();
    // the form should be gone, replaced by the success view
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
  });

  it("shows a general error banner on a genuine failure (e.g. server error)", async () => {
    const user = userEvent.setup();
    (resendVerification as ReturnType<typeof vi.fn>).mockRejectedValue(
      new ApiError("Internal Server Error", 500),
    );

    renderPage();

    await user.type(screen.getByLabelText("Email"), "lahcen@test.com");
    await user.click(
      screen.getByRole("button", { name: "Send verification link" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Internal Server Error",
    );
    // the form should STILL be visible — this was a real failure, not a
    // "we still respond with success either way" case
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });
});
