/**
 * @file frontend/src/pages/admin/AdminOrdersPage.tsx
 */

import { invalidateByPrefix, cacheKeys, CacheStore } from "@/cache";
import { listAllOrders, changeOrderStatus } from "@/api/orders";
import { Select, Spinner, Pagination } from "@/components/ui";
import type { Order, OrderEventStatus } from "@/types/order";
import { usePagedFetch, useMutate, useToast, usePageMeta } from "@/hooks";
import { StatusBadge } from "@/components/shop";
import { formatCurrency } from "@/utils";
import { useState } from "react";

import styles from "./AdminOrdersPage.module.css";

const PAGE_SIZE = 10;

// used both for the filter dropdown AND each row's status-change
// dropdown — one shared source of truth for "every real status"
const ALL_STATUSES: OrderEventStatus[] = [
  "PENDING",
  "ACCEPTED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELED",
];

const STATUS_LABELS: Record<OrderEventStatus, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELED: "Canceled",
};

export function AdminOrdersPage() {
  usePageMeta({ title: "Admin — Orders", noIndex: true });

  const { showToast } = useToast();
  // "" means "no filter — show every status". We deliberately do NOT use
  // Select's "placeholder" prop for this (Part 7-A's placeholder option
  // is permanently disabled/unselectable once you pick a real option) —
  // a filter needs to be re-selectable back to "All", so "" is a REAL,
  // always-clickable option here instead.
  const [statusFilter, setStatusFilter] = useState<OrderEventStatus | "">("");

  const {
    data: orders,
    page,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,
    pagination,
    isLoading,
    isValidating,
    error,
  } = usePagedFetch(
    (pageNumber) =>
      cacheKeys.orders.adminAll({
        page: pageNumber,
        limit: PAGE_SIZE,
        status: statusFilter || undefined,
      }),
    (pageNumber) =>
      listAllOrders({
        page: pageNumber,
        limit: PAGE_SIZE,
        status: statusFilter || undefined,
      }),
    // 🚩 Part 5-C's fix, reused here exactly as it was in ShopPage (8-B):
    // changing the filter snaps back to page 1, so we never end up
    // requesting "page 3 of CANCELED orders" when there's only 1 page.
    { resetKey: statusFilter },
  );

  function handleStatusChangeSuccess(store: CacheStore) {
    // 🚩 Strategy 2 from Part 4-C, chosen deliberately here (see the "why"
    // section's honest comparison against Part 8-D's cart refinement) —
    // this refreshes this table (any page/filter) AND any cached
    // customer-facing detail/list view sharing the "orders:" prefix.
    invalidateByPrefix(store, "orders:");
    showToast("Order status updated.", "success");
  }

  if (isLoading) {
    return (
      <div className={styles.centered}>
        <Spinner label="Loading orders" size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className={styles.errorBanner}>
        Something went wrong while loading orders. Please try again.
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Orders</h1>
        <div className={styles.filter}>
          <Select
            label="Filter by status"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as OrderEventStatus | "")
            }
            options={[
              { value: "", label: "All statuses" },
              ...ALL_STATUSES.map((status) => ({
                value: status,
                label: STATUS_LABELS[status],
              })),
            ]}
          />
        </div>
      </div>

      {orders.length === 0 ? (
        <p className={styles.emptyState}>No orders found.</p>
      ) : (
        <div className={styles.tableWrapper} data-testid="orders-table-wrapper">
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Customer</th>
                <th scope="col">Total</th>
                <th scope="col">Payment</th>
                <th scope="col">Status</th>
                <th scope="col">Placed</th>
                <th scope="col">Update status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  onStatusChangeSuccess={handleStatusChangeSuccess}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={page}
        totalPages={pagination?.totalPages}
        hasNextPage={hasNextPage}
        hasPrevPage={hasPrevPage}
        onNext={nextPage}
        onPrev={prevPage}
        isLoading={isValidating}
      />
    </div>
  );
}

// A SEPARATE component, not an inline .map() callback — same reasoning
// as PayPalWarningScreen (Part 8-F): useMutate is a hook, and hooks
// cannot safely live inside a loop/array callback whose length can
// change between renders. Each OrderRow instance gets its OWN, properly
// isolated useMutate call.
function OrderRow({
  order,
  onStatusChangeSuccess,
}: {
  order: Order;
  onStatusChangeSuccess: (store: CacheStore) => void;
}) {
  const { showToast } = useToast();

  const { mutate: changeStatus, isLoading } = useMutate(
    (newStatus: OrderEventStatus) =>
      changeOrderStatus(order.id, { status: newStatus }),
    {
      onSuccess: (_data, _variables, store) => onStatusChangeSuccess(store),
      onError: () => {
        showToast(
          "Could not update this order's status. Please try again.",
          "error",
        );
      },
    },
  );

  return (
    <tr>
      <td>#{order.id}</td>
      <td>User #{order.userId}</td>
      <td>{formatCurrency(Number(order.netAmount))}</td>
      <td className={styles.paymentCell}>
        {order.paymentMethod === "PAYPAL" ? "PayPal" : "Cash on delivery"}
      </td>
      <td>
        <StatusBadge status={order.status} />
      </td>
      <td className={styles.dateCell}>
        {new Date(order.createdAt).toLocaleDateString()}
      </td>
      <td>
        <Select
          label={`Change status for order #${order.id}`}
          value={order.status}
          onChange={(e) =>
            changeStatus(e.target.value as OrderEventStatus).catch(() => {})
          }
          disabled={isLoading}
          options={ALL_STATUSES.map((status) => ({
            value: status,
            label: STATUS_LABELS[status],
          }))}
        />
      </td>
    </tr>
  );
}
