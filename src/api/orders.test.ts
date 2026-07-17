/**
 * @file frontend/src/api/orders.test.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createOrder,
  listMyOrders,
  getOrderById,
  cancelOrder,
  listAllOrders,
  listOrdersByUser,
  changeOrderStatus,
} from "./orders";

function createFakeResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify(body),
  };
}

describe("orders API functions", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("createOrder sends a POST to /orders with the payment method", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(createFakeResponse({ order: { id: 1 } }));

    await createOrder({ paymentMethod: "PAYPAL" });

    const [urlUsed, optionsUsed] = fetchMock.mock.calls[0];
    expect(urlUsed).toContain("/orders");
    expect(optionsUsed.method).toBe("POST");
    expect(JSON.parse(optionsUsed.body)).toEqual({ paymentMethod: "PAYPAL" });
  });

  it("createOrder works with NO input at all (backend defaults to CASH_ON_DELIVERY)", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(createFakeResponse({ order: { id: 1 } }));

    await createOrder();

    const [, optionsUsed] = fetchMock.mock.calls[0];
    // we send an empty object — it's the BACKEND's Zod default that fills in CASH_ON_DELIVERY
    expect(JSON.parse(optionsUsed.body)).toEqual({});
  });

  it("createOrder returns a PayPal-shaped response when approvalUrl is present", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      createFakeResponse({
        order: { id: 1 },
        approvalUrl: "https://paypal.com/approve/xyz",
        providerOrderId: "PAYPAL-123",
      }),
    );

    const result = await createOrder({ paymentMethod: "PAYPAL" });

    // this is exactly the pattern a real component would use to tell the
    // three possible response shapes apart from each other
    expect("approvalUrl" in result).toBe(true);
    if ("approvalUrl" in result) {
      expect(result.approvalUrl).toBe("https://paypal.com/approve/xyz");
    }
  });

  it("listMyOrders sends a GET to /orders and returns a plain array", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(createFakeResponse([{ id: 1 }, { id: 2 }]));

    const result = await listMyOrders();

    const [urlUsed, optionsUsed] = fetchMock.mock.calls[0];
    expect(urlUsed).toMatch(/\/orders$/); // exactly "/orders", not "/orders/index" or similar
    expect(optionsUsed.method).toBe("GET");
    // 🚩 confirms Gotcha A: no { data, pagination } wrapper here — just a raw array
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
  });

  it("getOrderById sends a GET to /orders/:id", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      createFakeResponse({ id: 9, products: [], events: [] }),
    );

    await getOrderById(9);

    const [urlUsed] = fetchMock.mock.calls[0];
    expect(urlUsed).toContain("/orders/9");
  });

  it("cancelOrder sends a PUT to /orders/:id/cancel", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      createFakeResponse({ id: 9, status: "CANCELED" }),
    );

    const result = await cancelOrder(9);

    const [urlUsed, optionsUsed] = fetchMock.mock.calls[0];
    expect(urlUsed).toContain("/orders/9/cancel");
    expect(optionsUsed.method).toBe("PUT");
    expect(result.status).toBe("CANCELED");
  });

  it("listAllOrders sends a GET to /orders/index with page, limit, and status", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      createFakeResponse({
        data: [],
        pagination: { current: 1, limit: 5, totalPages: 0, results: 0 },
      }),
    );

    await listAllOrders({ page: 2, limit: 5, status: "PENDING" });

    const [urlUsed] = fetchMock.mock.calls[0];
    expect(urlUsed).toContain("/orders/index");
    expect(urlUsed).toContain("page=2");
    expect(urlUsed).toContain("status=PENDING");
  });

  it("listOrdersByUser sends a GET to /orders/users/:id", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      createFakeResponse({
        data: [],
        pagination: { current: 1, limit: 5, totalPages: 0, results: 0 },
      }),
    );

    await listOrdersByUser(4, { page: 1 });

    const [urlUsed] = fetchMock.mock.calls[0];
    expect(urlUsed).toContain("/orders/users/4");
    expect(urlUsed).toContain("page=1");
  });

  it("changeOrderStatus sends a PUT to /orders/:id/status with the new status", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      createFakeResponse({ id: 9, status: "ACCEPTED" }),
    );

    await changeOrderStatus(9, { status: "ACCEPTED" });

    const [urlUsed, optionsUsed] = fetchMock.mock.calls[0];
    expect(urlUsed).toContain("/orders/9/status");
    expect(optionsUsed.method).toBe("PUT");
    expect(JSON.parse(optionsUsed.body)).toEqual({ status: "ACCEPTED" });
  });
});
