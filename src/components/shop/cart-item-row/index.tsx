/**
 * @file frontend/src/components/shop/cart-item-row/index.tsx
 */

import { changeCartQuantity, removeFromCart } from "@/api/cart";
import { updateCacheEntry, cacheKeys } from "@/cache";
import { QuantityInput } from "@/components/shop";
import { useMutate, useToast } from "@/hooks";
import type { CartItem } from "@/types/cart";
import { Icon } from "@/components/icons";
import { Button } from "@/components/ui";
import { formatCurrency } from "@/utils";
import { Link } from "react-router-dom";

import styles from "./styles.module.css";

export interface CartItemRowProps {
  item: CartItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const { showToast } = useToast();

  const { mutate: changeQuantity, isLoading: isChangingQuantity } = useMutate(
    (newQuantity: number) =>
      changeCartQuantity(item.id, { quantity: newQuantity }),
    {
      onSuccess: (updatedItem, _variables, store) => {
        // STRATEGY 3 from Part 4-C: in-place update. changeCartQuantity's
        // response already IS the fresh, correct item — we splice it
        // directly into the cached array. No extra network call needed.
        updateCacheEntry<CartItem[]>(store, cacheKeys.cart.all(), (current) =>
          (current ?? []).map((cartItem) =>
            cartItem.id === updatedItem.id ? updatedItem : cartItem,
          ),
        );
      },
      onError: () => {
        showToast("Could not update quantity. Please try again.", "error");
      },
    },
  );

  const { mutate: removeItem, isLoading: isRemoving } = useMutate(
    () => removeFromCart(item.id),
    {
      onSuccess: (_data, _variables, store) => {
        // 🚩 THE REFINEMENT described above: we already know exactly
        // which id was removed, so we filter it out directly — the same
        // Strategy 3 pattern as quantity changes, avoiding a pointless
        // full-cart refetch and the loading flicker that would cause.
        updateCacheEntry<CartItem[]>(store, cacheKeys.cart.all(), (current) =>
          (current ?? []).filter((cartItem) => cartItem.id !== item.id),
        );
      },
      onError: () => {
        showToast("Could not remove this item. Please try again.", "error");
      },
    },
  );

  const priceNumber = Number(item.product.price);
  const lineTotal = priceNumber * item.quantity;
  // disabled during EITHER mutation — stops a quantity change from
  // starting while a remove is already in flight for this same row, and
  // vice versa
  const isBusy = isChangingQuantity || isRemoving;

  return (
    <div className={styles.row}>
      {item.product.imageUrl ? (
        <img
          src={item.product.imageUrl}
          alt={item.product.name}
          loading="lazy"
          decoding="async"
          className={styles.image}
        />
      ) : (
        <div className={styles.imagePlaceholder}>No image</div>
      )}

      <div className={styles.info}>
        <Link to={`/products/${item.productId}`} className={styles.name}>
          {item.product.name}
        </Link>
        <span className={styles.unitPrice}>
          {formatCurrency(priceNumber)} each
        </span>
      </div>

      <div className={styles.quantityColumn}>
        {/* 🚩 bound DIRECTLY to item.quantity (the cache's real value) —
            no separate local state */}
        <QuantityInput
          value={item.quantity}
          // FIX 1: Catch the rejected promise so it doesn't leak out of the event handler
          onChange={(newQuantity) =>
            changeQuantity(newQuantity).catch(() => {})
          }
          disabled={isBusy}
        />
        {isChangingQuantity && (
          <span className={styles.savingLabel}>Saving…</span>
        )}
      </div>

      <span className={styles.lineTotal}>{formatCurrency(lineTotal)}</span>

      <Button
        variant="ghost"
        size="sm"
        // FIX 2: Catch the rejected promise here as well
        onClick={() => removeItem().catch(() => {})}
        isLoading={isRemoving}
        disabled={isChangingQuantity}
        aria-label={`Remove ${item.product.name} from cart`}
        className={styles.removeItemBtn}
      >
        <Icon name="trash" />
      </Button>
    </div>
  );
}
