/**
 * @file frontend/src/api/products.test.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  searchProducts,
  getProductById,
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "./products";

function createFakeResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify(body),
  };
}

describe("products API functions", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("searchProducts calls GET /products/search with q, page, and limit in the URL", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      createFakeResponse({
        data: [],
        pagination: { current: 1, limit: 5, totalPages: 0, results: 0 },
      }),
    );

    await searchProducts({ q: "phone", page: 2, limit: 5 });

    const [urlUsed, optionsUsed] = fetchMock.mock.calls[0];
    expect(urlUsed).toContain("/products/search");
    expect(urlUsed).toContain("q=phone");
    expect(urlUsed).toContain("page=2");
    expect(urlUsed).toContain("limit=5");
    expect(optionsUsed.method).toBe("GET");
  });

  it("searchProducts works with NO params (this is how our public Shop page browses everything)", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      createFakeResponse({
        data: [],
        pagination: { current: 1, limit: 5, totalPages: 0, results: 0 },
      }),
    );

    await searchProducts();

    const [urlUsed] = fetchMock.mock.calls[0];
    // the url should just be "/products/search" with no leftover "?" or params
    expect(urlUsed).toMatch(/\/products\/search$/);
  });

  it("getProductById calls GET /products/:id", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      createFakeResponse({ id: 7, name: "Phone" }),
    );

    await getProductById(7);

    const [urlUsed, optionsUsed] = fetchMock.mock.calls[0];
    expect(urlUsed).toContain("/products/7");
    expect(optionsUsed.method).toBe("GET");
  });

  it("listProducts calls GET /products with page and limit", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      createFakeResponse({
        data: [],
        pagination: { current: 1, limit: 10, totalPages: 0, results: 0 },
      }),
    );

    await listProducts({ page: 1, limit: 10 });

    const [urlUsed] = fetchMock.mock.calls[0];
    // it should hit "/products" directly, NOT "/products/search"
    expect(urlUsed).toMatch(/\/products\?/);
    expect(urlUsed).toContain("page=1");
  });

  it("createProduct sends a POST with a FormData body containing all fields", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      createFakeResponse({ id: 1, name: "New Product" }),
    );

    const fakeImageFile = new File(["fake-image-bytes"], "photo.png", {
      type: "image/png",
    });

    await createProduct({
      name: "New Product",
      description: "A great product",
      price: 29.99,
      tags: ["sale", "new"],
      image: fakeImageFile,
    });

    const [urlUsed, optionsUsed] = fetchMock.mock.calls[0];
    expect(urlUsed).toContain("/products");
    expect(optionsUsed.method).toBe("POST");

    // confirm the body really IS a FormData object, not plain JSON text
    const bodyUsed = optionsUsed.body as FormData;
    expect(bodyUsed).toBeInstanceOf(FormData);
    // FormData.get() reads back one field's value by name
    expect(bodyUsed.get("name")).toBe("New Product");
    expect(bodyUsed.get("price")).toBe("29.99");
    // tags array should have been joined into a single comma string
    expect(bodyUsed.get("tags")).toBe("sale,new");
    expect(bodyUsed.get("image")).toBe(fakeImageFile);
  });

  it("updateProduct only includes the fields that were actually given", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      createFakeResponse({ id: 1, name: "Same Name", price: "39.99" }),
    );

    // only updating the price — nothing else
    await updateProduct(1, { price: 39.99 });

    const [urlUsed, optionsUsed] = fetchMock.mock.calls[0];
    expect(urlUsed).toContain("/products/1");
    expect(optionsUsed.method).toBe("PUT");

    const bodyUsed = optionsUsed.body as FormData;
    expect(bodyUsed.get("price")).toBe("39.99");
    // "name" was never given, so it should be completely ABSENT from the FormData —
    // this lets the backend's "?? existingProduct.name" fallback logic do its job
    expect(bodyUsed.get("name")).toBeNull();
  });

  it("deleteProduct sends a DELETE to /products/:id", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      createFakeResponse({
        status: true,
        message: "Product deleted successfully",
      }),
    );

    const result = await deleteProduct(5);

    const [urlUsed, optionsUsed] = fetchMock.mock.calls[0];
    expect(urlUsed).toContain("/products/5");
    expect(optionsUsed.method).toBe("DELETE");
    expect(result).toEqual({
      status: true,
      message: "Product deleted successfully",
    });
  });
});
