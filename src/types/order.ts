/**
 * @file frontend/src/types/order.ts
 */

import type { DecimalString, ID, ISODateString } from "./common";
import { Product } from "./product";
import { PublicUser } from "./user";

// These three match the enums in schema.prisma exactly.
export type OrderEventStatus =
  | "PENDING"
  | "ACCEPTED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELED";

export type PaymentMethod = "CASH_ON_DELIVERY" | "PAYPAL";

export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

// Matches "OrderProduct" in schema.prisma.
export interface OrderProduct {
  id: ID;
  orderId: ID;
  productId: ID;
  quantity: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  // 🚩 GOTCHA: ordersController's getOrderByIdCtrl does `include: { products: true }`
  // — this only includes the OrderProduct ROW, it does NOT nest the related Product
  // (that would need `products: { include: { product: true } }` on the backend).
  // So today, we ONLY get productId here — no product name, image, or price!
  // This means our order-details UI can't show product names/images yet without
  // a second fetch per product. This is a real gap worth flagging to Mohamed,
  // exactly like the cart/order include gaps you caught before.

  // 🚩 UPDATED: orderProductInclude now nests a partial Product record
  // (id, name, price, imageUrl) on every order-fetching endpoint EXCEPT
  // listAllOrdersCtrl's admin table, which never requests it — kept
  // optional so components can't assume it's always present.
  product?: Pick<Product, "id" | "name" | "price" | "imageUrl">;
}

// Matches "OrderEvent" in schema.prisma — the order's status history log.
export interface OrderEvent {
  id: ID;
  orderId: ID;
  status: OrderEventStatus;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// Matches "Order" in schema.prisma.
export interface Order {
  id: ID;
  userId: ID;
  netAmount: DecimalString; // Decimal(12,2) → arrives as a string, e.g. "129.99"
  address: string; // a plain formatted text address, built once at order-creation time
  status: OrderEventStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentProviderId: string | null; // PayPal's own order id, or null for cash orders
  paidAt: ISODateString | null; // null until PayPal capture succeeds
  createdAt: ISODateString;
  updatedAt: ISODateString;
  // 🚩 Both marked OPTIONAL ("?") on purpose — NOT every endpoint includes these!
  // - listOrdersCtrl includes "products" but not "events"
  // - getOrderByIdCtrl includes BOTH "products" and "events"
  // - listAllOrdersCtrl (admin), cancelOrderCtrl, changeStatusCtrl include NEITHER
  // Our components must always check "if (order.products)" before using it —
  // TypeScript's strict mode will actually force us to do this check, which protects
  // us from a real crash if we forget which endpoint we called.
  products?: OrderProduct[];
  events?: OrderEvent[];

  // 🚩 NEW: only present on listAllOrdersCtrl's admin response — every
  // OTHER order-fetching endpoint (mine, byUser, detail) does not include
  // this, so it stays optional here too.
  user?: PublicUser;
}

// createOrderCtrl has THREE possible shapes depending on what happens:
// 1. Cash on delivery → just { order }
// 2. PayPal succeeds → { order, approvalUrl, providerOrderId }
// 3. PayPal fails to start → { order, warning }
// We model this as a union of three possibilities using a shared base.
export interface CreateOrderCodResponse {
  order: Order;
}

export interface CreateOrderPayPalSuccessResponse {
  order: Order;
  approvalUrl: string; // the PayPal URL we redirect the user to
  providerOrderId: string;
}

export interface CreateOrderPayPalFailedResponse {
  order: Order;
  warning: string; // order was still saved, just PayPal setup failed
}

// The "|" here means "this could be ANY ONE of these three shapes".
// Our code will check "if ('approvalUrl' in response)" etc. to tell them apart.
export type CreateOrderResponse =
  | CreateOrderCodResponse
  | CreateOrderPayPalSuccessResponse
  | CreateOrderPayPalFailedResponse;

// 🚩 Gotcha A from above: listOrdersCtrl returns a PLAIN array, no pagination wrapper!
export type ListOrdersResponse = Order[];

// matches createOrderSchema exactly. "paymentMethod" is OPTIONAL here because
// the Zod schema gives it a .default("CASH_ON_DELIVERY") — so leaving it out
// entirely is perfectly valid, matching how the backend already behaves.
export interface CreateOrderInput {
  paymentMethod?: PaymentMethod;
}

// the query params accepted by BOTH listAllOrdersCtrl and ListUserOrdersCtrl
export interface OrderQueryParams {
  page?: number;
  limit?: number;
  status?: OrderEventStatus;
}

// matches the { status } body that changeStatusCtrl reads from req.body
export interface ChangeOrderStatusInput {
  status: OrderEventStatus;
}
