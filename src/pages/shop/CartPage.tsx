/**
 * @file frontend/src/pages/shop/CartPage.tsx
 */

import { CartItemRow } from "@/components/shop";
import { useFetch } from "@/hooks/useFetch";
import { Spinner } from "@/components/ui";
import { formatCurrency } from "@/utils";
import { Link } from "react-router-dom";
import { usePageMeta } from "@/hooks";
import { getCart } from "@/api/cart";
import { cacheKeys } from "@/cache";

import styles from "./CartPage.module.css";

export function CartPage() {
  usePageMeta({ title: "Your cart", noIndex: true });

  // no "enabled" check needed here — CartPage only ever renders inside
  // <ProtectedRoute /> (Part 6-B), which already guarantees a logged-in
  // user by the time this component mounts at all.
  const {
    data: cartItems,
    isLoading,
    error,
  } = useFetch(cacheKeys.cart.all(), getCart);

  if (isLoading) {
    return (
      <div className={styles.centered}>
        <Spinner label="Loading your cart" size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className={styles.errorBanner}>
        Something went wrong while loading your cart. Please try again.
      </div>
    );
  }

  const items = cartItems ?? [];

  if (items.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h1>Your cart is empty</h1>
        <p>Looks like you haven&apos;t added anything yet.</p>
        <Link to="/">Continue shopping</Link>
      </div>
    );
  }

  // 🚩 same Part 2-A gotcha as every other product display: each item's
  // nested product.price is a STRING — we convert before summing
  const total = items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0,
  );

  return (
    <div className={styles.page}>
      <h1>Your cart</h1>

      <div className={styles.list}>
        {items.map((item) => (
          <CartItemRow key={item.id} item={item} />
        ))}
      </div>

      <div className={styles.summary}>
        <span className={styles.totalLabel}>Total</span>
        <span className={styles.totalAmount}>{formatCurrency(total)}</span>
      </div>

      {/* We deliberately style this <Link> directly as a button, rather
          than nesting a real <button> INSIDE it. Two overlapping
          interactive elements (a clickable button inside a clickable
          link) is invalid HTML and genuinely confusing for screen reader
          and keyboard users, who'd hear/reach two different "clickable
          things" stacked on top of each other. */}
      <Link to="/checkout" className={styles.checkoutButton}>
        Proceed to checkout
      </Link>
    </div>
  );
}
