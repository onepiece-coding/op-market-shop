/**
 * @file frontend/src/types/cart.ts
 */

import type { ID, ISODateString } from "./common";
import type { Product } from "./product";

// Matches "CartItem" in schema.prisma. Every cart controller uses
// `include: { product: true }`, so the full nested Product is ALWAYS present
// on cart items — that's why "product" is required here, not optional.
export interface CartItem {
  id: ID;
  userId: ID;
  productId: ID;
  product: Product; // the full product details, nested inside the cart item
  quantity: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// 🚩 Gotcha B: deleteItemFromCartCtrl uses "success", NOT "status"!
// This is genuinely a different field name than DeleteProductResponse above —
// we must NOT accidentally reuse one type for both, or TypeScript would let
// us read the wrong field name without complaint.
export interface DeleteCartItemResponse {
  success: true;
  message: string;
}

// matches cartSchema exactly: { productId, quantity }
export interface AddToCartInput {
  productId: number;
  quantity: number;
}

// matches changeQuantitySchema exactly: { quantity }
export interface ChangeQuantityInput {
  quantity: number;
}
