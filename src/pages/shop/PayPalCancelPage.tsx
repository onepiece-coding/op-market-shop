/**
 * @file frontend/src/pages/shop/PayPalCancelPage.tsx
 */

import { useSearchParams, Link } from "react-router-dom";
import { usePayPalRetry } from "@/hooks/usePayPalRetry";
import { Button } from "@/components/ui";
import { useToast } from "@/hooks";

import styles from "./PayPalStatusPage.module.css";

// The page PayPal sends the user back to if they CANCEL or close the
// checkout popup before finishing (matches PAYPAL_CANCEL_PATH). The
// order still exists — we just offer a way to try paying again.
export function PayPalCancelPage() {
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const orderIdParam = searchParams.get("orderId");
  const orderId = Number(orderIdParam);
  const isValidOrderId = Number.isFinite(orderId);

  const { mutate: retry, isLoading } = usePayPalRetry(orderId, (error) => {
    showToast(error.message, "error");
  });

  if (!isValidOrderId) {
    return (
      <div className={styles.centered}>
        <p role="alert">This payment link is missing a valid order id.</p>
        <Link to="/orders">Go to my orders</Link>
      </div>
    );
  }

  return (
    <div className={styles.centered}>
      <h1>Payment cancelled</h1>
      <p>
        You closed or cancelled the PayPal checkout before it finished. Your
        order is still saved — you can try again.
      </p>
      <div className={styles.actions}>
        <Button onClick={() => retry().catch(() => {})} isLoading={isLoading}>
          Retry PayPal payment
        </Button>
        <Link to="/orders">Go to my orders</Link>
      </div>
    </div>
  );
}
