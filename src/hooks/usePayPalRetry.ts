/**
 * @file frontend/src/hooks/usePayPalRetry.ts
 */

import { retryPayPalPayment } from "@/api/payments";
import type { ID } from "@/types/common";
import { useMutate } from "./useMutate";

/**
 * Wraps retryPayPalPayment with the ONE thing every caller needs to do
 * identically on success: leave the SPA and send the browser to PayPal's
 * real approval page.
 * Used both on CheckoutPage's PayPalWarningScreen and on PayPalCancelPage.
 */
export function usePayPalRetry(orderId: ID, onError?: (error: Error) => void) {
  return useMutate(() => retryPayPalPayment(orderId), {
    onSuccess: (response) => {
      window.location.href = response.approvalUrl;
    },
    onError: (error) => {
      onError?.(error);
    },
  });
}
