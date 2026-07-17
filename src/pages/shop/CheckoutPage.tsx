/**
 * @file frontend/src/pages/shop/CheckoutPage.tsx
 */

import type { Order, PaymentMethod } from "@/types/order";
import { Modal, Button, Spinner } from "@/components/ui";
import { listAddresses, updateUser } from "@/api/users";
import { usePayPalRetry } from "@/hooks/usePayPalRetry";
import { invalidateExact } from "@/cache/invalidate";
import type { Address } from "@/types/address";
import { cacheKeys } from "@/cache/cacheKeys";
import { useMutate } from "@/hooks/useMutate";
import { useEffect, useState } from "react";
import { useFetch } from "@/hooks/useFetch";
import { useAuth, usePageMeta, useToast } from "@/hooks";
import { createOrder } from "@/api/orders";
import { formatCurrency } from "@/utils";
import { Link } from "react-router-dom";
import { getCart } from "@/api/cart";
import {
  AddressCard,
  AddressForm,
  PaymentMethodSelector,
} from "@/components/shop";

import styles from "./CheckoutPage.module.css";

// Same discriminated-union pattern as SignupPage (Part 6-C-2) — TypeScript
// makes it impossible to accidentally render, say, a "success" screen
// without a real order attached to it.
type ScreenState =
  | { mode: "form" }
  | { mode: "redirecting" }
  | { mode: "success"; order: Order }
  | { mode: "paypal-warning"; order: Order };

export function CheckoutPage() {
  usePageMeta({ title: "Checkout", noIndex: true });

  const { user } = useAuth();
  const { showToast } = useToast();

  const { data: cartItems, isLoading: isCartLoading } = useFetch(
    cacheKeys.cart.all(),
    getCart,
  );
  const { data: addresses, isLoading: isAddressesLoading } = useFetch(
    cacheKeys.users.addresses(),
    listAddresses,
  );

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null,
  );
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("CASH_ON_DELIVERY");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [screen, setScreen] = useState<ScreenState>({ mode: "form" });

  useEffect(() => {
    if (selectedAddressId !== null) return;
    if (!addresses || addresses.length === 0) return;

    const currentDefault = addresses.find(
      (address) => address.id === user?.defaultShippingAddress,
    );
    queueMicrotask(() => {
      setSelectedAddressId(
        currentDefault ? currentDefault.id : addresses[0].id,
      );
    });
  }, [addresses, user?.defaultShippingAddress, selectedAddressId]);

  const { mutate: placeOrder, isLoading: isPlacingOrder } = useMutate(
    async () => {
      if (selectedAddressId === null) {
        throw new Error("Please select a shipping address.");
      }

      // createOrderCtrl reads req.user.defaultShippingAddress directly —
      // see Part 8-E's "why" section for the full explanation of this
      // required sequencing.
      await updateUser({ defaultShippingAddress: selectedAddressId });

      return createOrder({ paymentMethod });
    },
    {
      onSuccess: (response, _variables, store) => {
        // The cart is empty server-side and a new order exists, regardless
        // of WHICH of the three response shapes we got back — invalidate both.
        invalidateExact(store, cacheKeys.cart.all());
        invalidateExact(store, cacheKeys.orders.mine());

        if ("approvalUrl" in response) {
          // PayPal accepted the order — leave the SPA entirely. We still
          // set this state first: if the browser takes even a moment to
          // navigate away, the user sees a clear "redirecting" message
          // instead of a frozen button.
          setScreen({ mode: "redirecting" });
          window.location.href = response.approvalUrl;
          return;
        }

        if ("warning" in response) {
          // Order WAS saved, but PayPal checkout failed to even start
          // (see createOrderCtrl's catch branch). This is genuinely
          // different from success — we show a dedicated retry screen.
          setScreen({ mode: "paypal-warning", order: response.order });
          return;
        }

        // plain cash-on-delivery success
        setScreen({ mode: "success", order: response.order });
      },
      onError: (error) => {
        showToast(error.message, "error");
      },
    },
  );

  function handleAddressAdded(newAddress: Address) {
    setSelectedAddressId(newAddress.id);
    setIsAddModalOpen(false);
  }

  const isLoading = isCartLoading || isAddressesLoading;
  const items = cartItems ?? [];
  const isCartEmpty = items.length === 0;

  const total = items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0,
  );

  if (isLoading) {
    return (
      <div className={styles.centered}>
        <Spinner label="Loading checkout" size="lg" />
      </div>
    );
  }

  if (screen.mode === "redirecting") {
    return (
      <div className={styles.centered}>
        <Spinner label="Redirecting to PayPal" size="lg" />
      </div>
    );
  }

  if (screen.mode === "paypal-warning") {
    return <PayPalWarningScreen order={screen.order} />;
  }

  if (screen.mode === "success") {
    return (
      <div className={styles.success}>
        <h1>Order placed! 🎉</h1>
        <p>
          Your order #{screen.order.id} has been placed for{" "}
          {formatCurrency(Number(screen.order.netAmount))}.
        </p>
        <div className={styles.successActions}>
          <Link to="/">Continue shopping</Link>
          <Link to="/orders">View my orders</Link>
        </div>
      </div>
    );
  }

  if (isCartEmpty) {
    return (
      <div className={styles.emptyState}>
        <h1>Your cart is empty</h1>
        <p>Add some items to your cart before checking out.</p>
        <Link to="/">Continue shopping</Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1>Checkout</h1>

      <section className={styles.section}>
        <h2>Shipping address</h2>

        {addresses && addresses.length > 0 ? (
          <div className={styles.addressList}>
            {addresses.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                isSelected={address.id === selectedAddressId}
                onSelect={() => setSelectedAddressId(address.id)}
              />
            ))}
          </div>
        ) : (
          <p className={styles.noAddresses}>
            You don&apos;t have any saved addresses yet.
          </p>
        )}

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
        >
          + Add new address
        </Button>
      </section>

      <section className={styles.section}>
        <h2>Payment method</h2>
        <PaymentMethodSelector
          value={paymentMethod}
          onChange={setPaymentMethod}
        />
      </section>

      <section className={styles.section}>
        <h2>Order summary</h2>
        <ul className={styles.summaryList}>
          {items.map((item) => (
            <li key={item.id} className={styles.summaryRow}>
              <span>
                {item.product.name} × {item.quantity}
              </span>
              <span>
                {formatCurrency(Number(item.product.price) * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className={styles.totalRow}>
          <span>Total</span>
          <span className={styles.totalAmount}>{formatCurrency(total)}</span>
        </div>
      </section>

      <Button
        fullWidth
        size="lg"
        onClick={() => placeOrder()}
        isLoading={isPlacingOrder}
        disabled={selectedAddressId === null}
      >
        {paymentMethod === "PAYPAL"
          ? "Continue to PayPal"
          : "Place order (Cash on delivery)"}
      </Button>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add a new address"
      >
        <AddressForm
          onAdded={handleAddressAdded}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

// A SEPARATE component (not just an inline branch) specifically so it can
// call usePayPalRetry — a hook — safely. CheckoutPage itself has several
// EARLY RETURNS above (isLoading, isCartEmpty, other screen modes), and
// React's rules require every hook to run in the exact same order on
// every render. Calling a hook only for ONE specific screen state, from
// inside a function that sometimes returns before reaching it, would
// break that rule. A dedicated component sidesteps this entirely: ITS
// hooks run consistently every time IT mounts, regardless of what
// CheckoutPage did before deciding to render it.
function PayPalWarningScreen({ order }: { order: Order }) {
  const { showToast } = useToast();
  const { mutate: retry, isLoading } = usePayPalRetry(order.id, (error) => {
    showToast(error.message, "error");
  });

  return (
    <div className={styles.success}>
      <h1>Order created — payment setup incomplete</h1>
      <p>
        Your order #{order.id} was saved, but we couldn&apos;t start the PayPal
        checkout. You can retry now, or view it later from your orders page.
      </p>
      <div className={styles.successActions}>
        <Button onClick={() => retry()} isLoading={isLoading}>
          Retry PayPal payment
        </Button>
        <Link to="/orders">View my orders</Link>
      </div>
    </div>
  );
}
