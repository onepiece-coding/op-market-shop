/**
 * @file frontend/api/cart.test.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  addToCart,
  getCart,
  changeCartItemQuantity,
  removeFromCart,
} from "./cart";

function createFakeResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify(body),
  };
}

describe("cart API functions", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("addToCart sends a POST to /cart with productId and quantity", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      createFakeResponse({
        id: 1,
        userId: 1,
        productId: 5,
        quantity: 2,
        product: { id: 5, name: "Phone" },
      }),
    );

    const result = await addToCart({ productId: 5, quantity: 2 });

    const [urlUsed, optionsUsed] = fetchMock.mock.calls[0];
    expect(urlUsed).toContain("/cart");
    expect(optionsUsed.method).toBe("POST");
    expect(JSON.parse(optionsUsed.body)).toEqual({ productId: 5, quantity: 2 });
    // confirm the nested "product" object comes through untouched in the result
    expect(result.product).toEqual({ id: 5, name: "Phone" });
  });

  it("getCart sends a GET to /cart and returns a plain array", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      createFakeResponse([
        { id: 1, quantity: 2, product: { id: 5, name: "Phone" } },
      ]),
    );

    const result = await getCart();

    const [urlUsed, optionsUsed] = fetchMock.mock.calls[0];
    expect(urlUsed).toMatch(/\/cart$/); // exactly "/cart", nothing appended after it
    expect(optionsUsed.method).toBe("GET");
    // confirm we get back a real array, NOT wrapped in { data: [...] }
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
  });

  it("changeCartItemQuantity sends a PUT to /cart/:id with the new quantity", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      createFakeResponse({
        id: 9,
        quantity: 4,
        product: { id: 5, name: "Phone" },
      }),
    );

    await changeCartItemQuantity(9, { quantity: 4 });

    const [urlUsed, optionsUsed] = fetchMock.mock.calls[0];
    // must use the CART ITEM's id (9), not the product's id
    expect(urlUsed).toContain("/cart/9");
    expect(optionsUsed.method).toBe("PUT");
    expect(JSON.parse(optionsUsed.body)).toEqual({ quantity: 4 });
  });

  it("removeFromCart sends a DELETE to /cart/:id", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      createFakeResponse({
        success: true,
        message: "Item has been removed from cart",
      }),
    );

    const result = await removeFromCart(9);

    const [urlUsed, optionsUsed] = fetchMock.mock.calls[0];
    expect(urlUsed).toContain("/cart/9");
    expect(optionsUsed.method).toBe("DELETE");
    // confirm this uses "success", matching DeleteCartItemResponse — NOT "status"
    // (that field name only belongs to product/address deletes, from our Part 2-B gotcha)
    expect(result).toEqual({
      success: true,
      message: "Item has been removed from cart",
    });
  });
});
