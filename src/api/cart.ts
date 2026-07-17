/**
 * @file frontend/api/cart.ts
 */

import { apiRequest } from "./apiRequest";
import type {
  CartItem,
  AddToCartInput,
  ChangeQuantityInput,
  DeleteCartItemResponse,
} from "@/types/cart";
import type { ID } from "@/types/common";

// ---- POST /api/v1/cart ----
// Adds a product to the cart, OR increases its quantity if it's already there.
// Either way, the backend sends back the full CartItem (with product nested inside).
export async function addToCart(input: AddToCartInput): Promise<CartItem> {
  return apiRequest<CartItem>("/cart", {
    method: "POST",
    body: input,
  });
}

// ---- PUT /api/v1/cart/:id ----
// "id" here is the CartItem's own id (not the product's id!) — matches
// how changeQuantityCtrl looks up the row: where: { id: cartId, userId }.
export async function changeCartQuantity(
  id: ID,
  input: ChangeQuantityInput,
): Promise<CartItem> {
  return apiRequest<CartItem>(`/cart/${id}`, {
    method: "PUT",
    body: input,
  });
}

// ---- GET /api/v1/cart ----
// Returns EVERY cart item belonging to the logged-in user, as a plain array
// (no pagination wrapper here — carts are small, so the backend doesn't paginate them).
export async function getCart(): Promise<CartItem[]> {
  return apiRequest<CartItem[]>("/cart", {
    method: "GET",
  });
}

// ---- PUT /api/v1/cart/:id ----
// "id" here is the CartItem's own id, NOT the product's id — easy mix-up to make!
// Look at cartController.ts's changeQuantityCtrl: it filters by { id: cartId, userId }.
export async function changeCartItemQuantity(
  cartItemId: ID,
  input: ChangeQuantityInput,
): Promise<CartItem> {
  return apiRequest<CartItem>(`/cart/${cartItemId}`, {
    method: "PUT",
    body: input,
  });
}

// ---- DELETE /api/v1/cart/:id ----
// Again, "id" is the CartItem's own id, not the product's id.
export async function removeFromCart(
  cartItemId: ID,
): Promise<DeleteCartItemResponse> {
  return apiRequest<DeleteCartItemResponse>(`/cart/${cartItemId}`, {
    method: "DELETE",
  });
}
