/**
 * @file frontend/src/api/orders.ts
 */

import { apiRequest } from "./apiRequest";
import { buildQueryString } from "@/utils/queryString";
import type {
  Order,
  CreateOrderInput,
  CreateOrderResponse,
  ListOrdersResponse,
  OrderQueryParams,
  ChangeOrderStatusInput,
} from "@/types/order";
import type { PaginatedResponse } from "@/types/api";
import type { ID } from "@/types/common";

// ---- POST /api/v1/orders ----
// Turns the user's current cart into a real order (and empties the cart —
// see createOrderCtrl's "await tx.cartItem.deleteMany" at the end).
// Returns a UNION type — callers must check WHICH shape came back, e.g.:
//   const res = await createOrder({ paymentMethod: "PAYPAL" });
//   if ("approvalUrl" in res) { window.location.href = res.approvalUrl; }
export async function createOrder(
  input: CreateOrderInput = {},
): Promise<CreateOrderResponse> {
  return apiRequest<CreateOrderResponse>("/orders", {
    method: "POST",
    body: input,
  });
}

// ---- GET /api/v1/orders ----
// 🚩 Returns a PLAIN ARRAY — no { data, pagination } wrapper (see ListOrdersResponse).
// This is the "my own orders" list — includes "products" but NOT "events".
export async function listMyOrders(): Promise<ListOrdersResponse> {
  return apiRequest<ListOrdersResponse>("/orders", {
    method: "GET",
  });
}

// ---- GET /api/v1/orders/:id ----
// Works for BOTH regular users (only their own order) and admins (any order) —
// getOrderByIdCtrl checks req.user.role internally, so our frontend code
// doesn't need two different functions here.
export async function getOrderById(id: ID): Promise<Order> {
  return apiRequest<Order>(`/orders/${id}`, {
    method: "GET",
  });
}

// ---- PUT /api/v1/orders/:id/cancel ----
// 🚩 Returns the order with NO "products"/"events" included — both will be
// undefined here, even though the Order type marks them optional either way.
export async function cancelOrder(id: ID): Promise<Order> {
  return apiRequest<Order>(`/orders/${id}/cancel`, {
    method: "PUT",
  });
}

// ---- GET /api/v1/orders/index ---- (ADMIN ONLY)
// The "list every order across every user" view, for the admin panel.
export async function listAllOrders(
  params: OrderQueryParams = {},
): Promise<PaginatedResponse<Order>> {
  const qs = buildQueryString({
    page: params.page,
    limit: params.limit,
    status: params.status,
  });
  return apiRequest<PaginatedResponse<Order>>(`/orders/index${qs}`, {
    method: "GET",
  });
}

// ---- GET /api/v1/orders/users/:id ---- (ADMIN ONLY)
// All orders belonging to ONE specific user — e.g. for an admin viewing
// a single customer's order history.
export async function listOrdersByUser(
  userId: ID,
  params: OrderQueryParams = {},
): Promise<PaginatedResponse<Order>> {
  const qs = buildQueryString({
    page: params.page,
    limit: params.limit,
    status: params.status,
  });
  return apiRequest<PaginatedResponse<Order>>(`/orders/users/${userId}${qs}`, {
    method: "GET",
  });
}

// ---- PUT /api/v1/orders/:id/status ---- (ADMIN ONLY)
// Moves an order forward through its lifecycle, e.g. PENDING -> ACCEPTED.
// Also creates a new OrderEvent row on the backend (an audit log entry) —
// but that log entry is NOT included in this specific response.
export async function changeOrderStatus(
  id: ID,
  input: ChangeOrderStatusInput,
): Promise<Order> {
  return apiRequest<Order>(`/orders/${id}/status`, {
    method: "PUT",
    body: input,
  });
}
