/**
 * @file frontend/src/pages/auth/VerifyEmailPage.test.tsx
 */

import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { VerifyEmailPage } from "./VerifyEmailPage";
import { StrictMode } from "react";

import userEvent from "@testing-library/user-event";

vi.mock("@/hooks", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "@/hooks";

function renderVerifyPage(
  path = "/verify-email?token=abc123",
  useStrictMode = false,
) {
  const tree = (
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>
    </MemoryRouter>
  );
  return render(useStrictMode ? <StrictMode>{tree}</StrictMode> : tree);
}

describe("VerifyEmailPage", () => {
  const verifyEmailMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      verifyEmail: verifyEmailMock,
    });
  });

  it("shows a 'verifying' state immediately on mount", () => {
    // never resolves during this test — lets us inspect the FIRST state
    verifyEmailMock.mockReturnValue(new Promise(() => {}));

    renderVerifyPage();

    expect(screen.getByRole("status")).toHaveTextContent(
      "Please wait a moment…",
    );
  });

  it("shows an error immediately, WITHOUT calling verifyEmail, when the url has no token", async () => {
    renderVerifyPage("/verify-email"); // no "?token=..." at all

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This verification link is missing its token.",
    );
    expect(verifyEmailMock).not.toHaveBeenCalled();
  });

  it("calls verifyEmail with the token from the URL, and shows the success message", async () => {
    verifyEmailMock.mockResolvedValue({
      user: { id: 1, name: "Lahcen" },
      message: "Email verified successfully.",
    });

    renderVerifyPage("/verify-email?token=real-token-123");

    await waitFor(() =>
      expect(verifyEmailMock).toHaveBeenCalledWith("real-token-123"),
    );

    expect(
      await screen.findByText("Email verified successfully."),
    ).toBeInTheDocument();
  });

  it("clicking 'Continue to op-market' navigates to the homepage", async () => {
    const user = userEvent.setup();
    verifyEmailMock.mockResolvedValue({
      user: { id: 1, name: "Lahcen" },
      message: "Email verified successfully.",
    });

    renderVerifyPage();

    const continueButton = await screen.findByRole("button", {
      name: "Continue to op-market",
    });
    await user.click(continueButton);

    expect(await screen.findByText("Home Page")).toBeInTheDocument();
  });

  it("shows the backend's error message and a link to resend, when verification fails", async () => {
    verifyEmailMock.mockRejectedValue(
      new Error("Invalid or expired verification token"),
    );

    renderVerifyPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid or expired verification token",
    );
    expect(
      screen.getByText("Request a new verification link"),
    ).toBeInTheDocument();
  });

  it("only calls verifyEmail ONCE, even under React StrictMode's double-invoke in development", async () => {
    verifyEmailMock.mockResolvedValue({
      user: { id: 1, name: "Lahcen" },
      message: "Email verified successfully.",
    });

    // StrictMode deliberately runs effects twice on mount in development —
    // this is EXACTLY the scenario our hasAttemptedRef guard protects against
    renderVerifyPage("/verify-email?token=abc123", true);

    await waitFor(() => expect(verifyEmailMock).toHaveBeenCalled());
    // give any potential SECOND effect run a moment to happen, if our guard failed
    await new Promise((resolve) => setTimeout(resolve, 0));

    // if this is 2, it means we sent this single-use token to the server
    // twice, and the real backend would have rejected the second call
    expect(verifyEmailMock).toHaveBeenCalledTimes(1);
  });
});
