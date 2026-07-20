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

const CANCELABLE_STATUSES: OrderEventStatus[] = ["PENDING", "ACCEPTED"];

export function OrdersPage() {
  // 🚩 MOVED HERE from OrderCard — this is a PAGE-LEVEL concern and must
  // be called exactly ONCE, regardless of how many order cards render.
  // Calling it per-card meant its cleanup fired every time a SINGLE card
  // unmounted (e.g. after canceling one order), incorrectly resetting
  // the document title while the user was still on this same page.
  usePageMeta({ title: "My orders", noIndex: true });

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

function OrderCard({ order }: { order: Order }) {
  const { showToast } = useToast();

  const { mutate: cancel, isLoading: isCanceling } = useMutate(
    () => cancelOrder(order.id),
    {
      onSuccess: (updatedOrder, _variables, store) => {
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

      {order.products && order.products.length > 0 && (
        <ul className={styles.itemsList}>
          {order.products.map((item) => (
            <li key={item.id} className={styles.itemRow}>
              <Link
                to={`/products/${item.productId}`}
                className={styles.itemLink}
              >
                {item.product?.imageUrl ? (
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    loading="lazy"
                    decoding="async"
                    className={styles.itemImage}
                  />
                ) : (
                  <div className={styles.itemImagePlaceholder}>
                    {item.product ? "No image" : "?"}
                  </div>
                )}
                <span className={styles.itemName}>
                  {/* 🚩 defensive fallback — see "why" above */}
                  {item.product?.name ?? `Product #${item.productId}`}
                </span>
              </Link>
              <span className={styles.itemQuantity}>× {item.quantity}</span>
              {item.product?.price && (
                <span className={styles.itemPrice}>
                  {formatCurrency(Number(item.product.price) * item.quantity)}
                </span>
              )}
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
