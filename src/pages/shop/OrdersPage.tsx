/**
 * @file frontend/src/pages/shop/OrdersPage.tsx
 */

import {
  usePayPalRetry,
  useFetch,
  useMutate,
  useToast,
  usePageMeta,
} from "@/hooks";
import type { Order, OrderEventStatus } from "@/types/order";
import { listMyOrders, cancelOrder } from "@/api/orders";
import { cacheKeys, updateCacheEntry } from "@/cache";
import { Button, Spinner } from "@/components/ui";
import { StatusBadge } from "@/components/shop";
import { formatCurrency } from "@/utils";
import { Link } from "react-router-dom";

import styles from "./OrdersPage.module.css";

// A CLIENT-SIDE restriction, not a backend rule.
// cancelOrderCtrl has no status guard at all; we add one here purely so
// a customer can't confusingly "cancel" a package that already shipped.
const CANCELABLE_STATUSES: OrderEventStatus[] = ["PENDING", "ACCEPTED"];

export function OrdersPage() {
  // 🚩 listMyOrders returns a PLAIN ARRAY (Part 2-B's Gotcha A) — no
  // { data, pagination } wrapper — so plain useFetch is correct here,
  // NOT usePagedFetch.
  const {
    data: orders,
    isLoading,
    error,
  } = useFetch(cacheKeys.orders.mine(), listMyOrders);

  if (isLoading) {
    return (
      <div className={styles.centered}>
        <Spinner label="Loading your orders" size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className={styles.errorBanner}>
        Something went wrong while loading your orders. Please try again.
      </div>
    );
  }

  const items = orders ?? [];

  if (items.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h1>My orders</h1>
        <p>You haven&apos;t placed any orders yet.</p>
        <Link to="/">Start shopping</Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1>My orders</h1>
      <div className={styles.list}>
        {items.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}

// A SEPARATE component, not an inline .map() callback — the same rule
// we hit with OrderRow (Part 9-C) and PayPalWarningScreen (Part 8-F):
// useMutate/usePayPalRetry are hooks, and hooks cannot safely live
// inside a loop callback whose length can change between renders.
function OrderCard({ order }: { order: Order }) {
  usePageMeta({ title: "My orders", noIndex: true });

  const { showToast } = useToast();

  const { mutate: cancel, isLoading: isCanceling } = useMutate(
    () => cancelOrder(order.id),
    {
      onSuccess: (updatedOrder, _variables, store) => {
        // 🚩 THE MERGE FIX from our "why" section: cancelOrderCtrl's
        // response has NO "products" field — replacing the cached order
        // wholesale would make this card's line items silently vanish.
        // We keep the EXISTING cached order and only overwrite "status".
        updateCacheEntry<Order[]>(store, cacheKeys.orders.mine(), (current) =>
          (current ?? []).map((o) =>
            o.id === order.id ? { ...o, status: updatedOrder.status } : o,
          ),
        );
        showToast("Order canceled.", "success");
      },
      onError: () => {
        showToast("Could not cancel this order. Please try again.", "error");
      },
    },
  );

  const { mutate: retryPayment, isLoading: isRetrying } = usePayPalRetry(
    order.id,
    (error) => {
      showToast(error.message, "error");
    },
  );

  const canCancel = CANCELABLE_STATUSES.includes(order.status);
  const canRetryPayment =
    order.paymentMethod === "PAYPAL" &&
    order.paymentStatus !== "COMPLETED" &&
    order.status !== "CANCELED";

  return (
    <article className={styles.card}>
      <header className={styles.cardHeader}>
        <div>
          <span className={styles.orderId}>Order #{order.id}</span>
          <span className={styles.orderDate}>
            {new Date(order.createdAt).toLocaleDateString()}
          </span>
        </div>
        <StatusBadge status={order.status} />
      </header>

      {/* 🚩 order.products (when present) only ever has productId +
          quantity — never a nested name/image/price. We show exactly
          what the backend actually gives us, not a pretend richer view. */}
      {order.products && order.products.length > 0 && (
        <ul className={styles.itemsList}>
          {order.products.map((item) => (
            <li key={item.id}>
              <Link to={`/products/${item.productId}`}>
                Product #{item.productId} × {item.quantity}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.cardFooter}>
        <span className={styles.paymentMethod}>
          {order.paymentMethod === "PAYPAL" ? "PayPal" : "Cash on delivery"}
        </span>
        <span className={styles.total}>
          {formatCurrency(Number(order.netAmount))}
        </span>
      </div>

      {(canCancel || canRetryPayment) && (
        <div className={styles.actions}>
          {canRetryPayment && (
            <Button
              size="sm"
              onClick={() => retryPayment().catch(() => {})}
              isLoading={isRetrying}
            >
              Retry payment
            </Button>
          )}
          {canCancel && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => cancel().catch(() => {})}
              isLoading={isCanceling}
              disabled={isRetrying}
            >
              Cancel order
            </Button>
          )}
        </div>
      )}
    </article>
  );
}
