/**
 * @file frontend/src/api/payments.test.ts
 */

import { retryPayPalPayment, capturePayPalPayment } from "./payments";
import { describe, it, expect, vi, beforeEach } from "vitest";

function createFakeResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify(body),
  };
}

describe("payments API functions", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("retryPayPalPayment sends a POST to /payments/paypal/:id/retry", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      createFakeResponse({
        message: "PayPal checkout restarted successfully",
        order: { id: 9 },
        approvalUrl: "https://paypal.com/approve/xyz",
        providerOrderId: "PAYPAL-999",
      }),
    );

    const result = await retryPayPalPayment(9);

    const [urlUsed, optionsUsed] = fetchMock.mock.calls[0];
    // "id" in the url is the ORDER's id
    expect(urlUsed).toContain("/payments/paypal/9/retry");
    expect(optionsUsed.method).toBe("POST");
    // retry has NO body — PayPal amount/order info comes from the saved order itself
    expect(optionsUsed.body).toBeUndefined();
    expect(result.approvalUrl).toBe("https://paypal.com/approve/xyz");
  });

  it("capturePayPalPayment sends a POST to /payments/paypal/:id/capture", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      createFakeResponse({
        message: "Payment completed successfully",
        order: { id: 9, paymentStatus: "COMPLETED" },
        capture: { status: "COMPLETED" },
      }),
    );

    const result = await capturePayPalPayment(9);

    const [urlUsed, optionsUsed] = fetchMock.mock.calls[0];
    expect(urlUsed).toContain("/payments/paypal/9/capture");
    expect(optionsUsed.method).toBe("POST");
    expect(result.order.paymentStatus).toBe("COMPLETED");
  });

  it("capturePayPalPayment still works fine when 'capture' is missing (already-paid case)", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    // this matches capturePayPalPaymentCtrl's "already completed" branch,
    // which sends { message, order } with NO "capture" field at all
    fetchMock.mockResolvedValueOnce(
      createFakeResponse({
        message: "Payment already completed",
        order: { id: 9, paymentStatus: "COMPLETED" },
      }),
    );

    const result = await capturePayPalPayment(9);

    expect(result.message).toBe("Payment already completed");
    // "capture" being undefined here is fine — we marked it optional (?) in our type
    expect(result.capture).toBeUndefined();
  });
});
