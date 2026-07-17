/**
 * @file frontend/src/types/payment.ts
 */

import type { Order } from "./order";

// retryPayPalPaymentCtrl's exact response shape
export interface RetryPayPalResponse {
  message: string;
  order: Order;
  approvalUrl: string;
  providerOrderId: string;
}

// capturePayPalPaymentCtrl has TWO possible shapes:
// 1. Payment was already completed earlier → just { message, order }
// 2. Payment captured just now → { message, order, capture }
// "capture" is PayPal's own raw response object — its exact shape isn't controlled
// by us at all (it comes from PayPal's API), so we type it loosely as a generic
// "Record<string, unknown>" meaning "an object with string keys, unknown values".
// We should NEVER assume specific fields inside it without checking first.
export interface CapturePayPalResponse {
  message: string;
  order: Order;
  capture?: Record<string, unknown>;
}
