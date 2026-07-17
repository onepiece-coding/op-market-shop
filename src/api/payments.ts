/**
 * @file frontend/src/api/payments.ts
 */

import { apiRequest } from "./apiRequest";
import type {
  RetryPayPalResponse,
  CapturePayPalResponse,
} from "@/types/payment";
import type { ID } from "@/types/common";

// ---- POST /api/v1/payments/paypal/:id/retry ----
// Used when a PayPal checkout needs to be started over — either the first
// attempt failed to set up, or the user never completed the PayPal popup.
// "id" here is the ORDER's id (not a payment id — payments don't have their own id).
export async function retryPayPalPayment(
  orderId: ID,
): Promise<RetryPayPalResponse> {
  return apiRequest<RetryPayPalResponse>(`/payments/paypal/${orderId}/retry`, {
    method: "POST",
  });
}

// ---- POST /api/v1/payments/paypal/:id/capture ----
// Called AFTER the user approves payment on PayPal's own site and is
// redirected back into our app. This step actually finalizes the charge.
export async function capturePayPalPayment(
  orderId: ID,
): Promise<CapturePayPalResponse> {
  return apiRequest<CapturePayPalResponse>(
    `/payments/paypal/${orderId}/capture`,
    {
      method: "POST",
    },
  );
}
