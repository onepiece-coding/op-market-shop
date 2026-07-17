/**
 * @file frontend/src/pages/shop/PayPalReturnPage.tsx
 */

import { useSearchParams, Link } from "react-router-dom";
import { capturePayPalPayment } from "@/api/payments";
import { invalidateExact, cacheKeys } from "@/cache";
import { useEffect, useRef } from "react";
import { Spinner } from "@/components/ui";
import { useMutate } from "@/hooks";

import styles from "./PayPalStatusPage.module.css";

// The page PayPal sends the user back to after they APPROVE the payment
// on PayPal's own site (matches PAYPAL_RETURN_PATH, built server-side
// in paypalService.ts). Its whole job is finalizing that payment.
export function PayPalReturnPage() {
  const [searchParams] = useSearchParams();
  const orderIdParam = searchParams.get("orderId");
  const orderId = Number(orderIdParam);
  const isValidOrderId = Number.isFinite(orderId);

  // Unlike VerifyEmailPage's guard (Part 6-C-3), THIS guard isn't
  // protecting against a real bug — capturePayPalPaymentCtrl is safe to
  // call twice. We keep it purely to avoid
  // one wasted network call under React StrictMode's double-invoke.
  const hasAttemptedRef = useRef(false);

  const {
    mutate: capture,
    isLoading,
    error,
    data,
  } = useMutate(() => capturePayPalPayment(orderId), {
    onSuccess: (_response, _variables, store) => {
      invalidateExact(store, cacheKeys.orders.mine());
      invalidateExact(store, cacheKeys.orders.detail(orderId));
    },
  });

  useEffect(() => {
    if (!isValidOrderId) return;
    if (hasAttemptedRef.current) return;
    hasAttemptedRef.current = true;
    capture().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValidOrderId, orderId]);

  if (!isValidOrderId) {
    return (
      <div className={styles.centered}>
        <p role="alert">This payment link is missing a valid order id.</p>
        <Link to="/orders">Go to my orders</Link>
      </div>
    );
  }

  if (isLoading || (!data && !error)) {
    return (
      <div className={styles.centered}>
        <Spinner label="Confirming your payment" size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.centered}>
        <h1>We couldn&apos;t confirm your payment</h1>
        <p role="alert">{error.message}</p>
        <Link to="/orders">Go to my orders</Link>
      </div>
    );
  }

  return (
    <div className={styles.centered}>
      <h1>Payment confirmed 🎉</h1>
      <p>Your order #{orderId} has been paid successfully.</p>
      <Link to="/orders">View my orders</Link>
    </div>
  );
}
