/**
 * @file frontend/src/pages/shop/PayPalReturnPage.test.tsx
 */

import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PayPalReturnPage } from "./PayPalReturnPage";
import { CacheProvider } from "@/cache";

vi.mock("@/api/payments", () => ({
  capturePayPalPayment: vi.fn(),
}));

import { capturePayPalPayment } from "@/api/payments";

function renderPage(path = "/checkout/paypal/return?orderId=42") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <CacheProvider>
        <Routes>
          <Route
            path="/checkout/paypal/return"
            element={<PayPalReturnPage />}
          />
          <Route path="/orders" element={<div>Orders Page</div>} />
        </Routes>
      </CacheProvider>
    </MemoryRouter>,
  );
}

describe("PayPalReturnPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows an error immediately, without calling the API, when orderId is missing or invalid", () => {
    renderPage("/checkout/paypal/return?orderId=abc");

    expect(
      screen.getByText("This payment link is missing a valid order id."),
    ).toBeInTheDocument();
    expect(capturePayPalPayment).not.toHaveBeenCalled();
  });

  it("calls capturePayPalPayment with the order id from the URL", async () => {
    (capturePayPalPayment as ReturnType<typeof vi.fn>).mockResolvedValue({
      message: "Payment completed successfully",
      order: { id: 42, paymentStatus: "COMPLETED" },
    });

    renderPage();

    await waitFor(() => expect(capturePayPalPayment).toHaveBeenCalledWith(42));
  });

  it("shows a success message once the payment is confirmed", async () => {
    (capturePayPalPayment as ReturnType<typeof vi.fn>).mockResolvedValue({
      message: "Payment completed successfully",
      order: { id: 42, paymentStatus: "COMPLETED" },
    });

    renderPage();

    expect(await screen.findByText("Payment confirmed 🎉")).toBeInTheDocument();
    expect(screen.getByText(/order #42/)).toBeInTheDocument();
  });

  it("shows an error message when capture fails", async () => {
    (capturePayPalPayment as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Unable to capture PayPal payment"),
    );

    renderPage();

    expect(
      await screen.findByText("We couldn't confirm your payment"),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Unable to capture PayPal payment",
    );
  });

  it("only calls capturePayPalPayment ONCE, avoiding a wasted call under StrictMode's double-invoke", async () => {
    (capturePayPalPayment as ReturnType<typeof vi.fn>).mockResolvedValue({
      message: "ok",
      order: { id: 42, paymentStatus: "COMPLETED" },
    });

    renderPage();

    await waitFor(() => expect(capturePayPalPayment).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(capturePayPalPayment).toHaveBeenCalledTimes(1);
  });
});
