/**
 * @file frontend/src/pages/shop/PayPalCancelPage.test.tsx
 */

import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PayPalCancelPage } from "./PayPalCancelPage";
import { CacheProvider } from "@/cache";

import userEvent from "@testing-library/user-event";

vi.mock("@/api/payments", () => ({
  retryPayPalPayment: vi.fn(),
}));
vi.mock("@/hooks", () => ({
  useToast: vi.fn(),
}));

import { retryPayPalPayment } from "@/api/payments";
import { useToast } from "@/hooks";

const showToastMock = vi.fn();

function renderPage(path = "/checkout/paypal/cancel?orderId=42") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <CacheProvider>
        <Routes>
          <Route
            path="/checkout/paypal/cancel"
            element={<PayPalCancelPage />}
          />
          <Route path="/orders" element={<div>Orders Page</div>} />
        </Routes>
      </CacheProvider>
    </MemoryRouter>,
  );
}

describe("PayPalCancelPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useToast as ReturnType<typeof vi.fn>).mockReturnValue({
      showToast: showToastMock,
    });
  });

  it("shows an error when orderId is missing or invalid", () => {
    renderPage("/checkout/paypal/cancel?orderId=abc");

    expect(
      screen.getByText("This payment link is missing a valid order id."),
    ).toBeInTheDocument();
  });

  it("shows a 'payment cancelled' message with a retry option", () => {
    renderPage();

    expect(screen.getByText("Payment cancelled")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Retry PayPal payment" }),
    ).toBeInTheDocument();
  });

  it("shows an error toast when retry fails", async () => {
    const user = userEvent.setup();
    (retryPayPalPayment as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("PayPal is unavailable"),
    );

    renderPage();

    await user.click(
      screen.getByRole("button", { name: "Retry PayPal payment" }),
    );

    await waitFor(() =>
      expect(showToastMock).toHaveBeenCalledWith(
        "PayPal is unavailable",
        "error",
      ),
    );
  });
});
