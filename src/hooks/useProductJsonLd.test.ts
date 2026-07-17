/**
 * @file frontend/src/hooks/useProductJsonLd.test.ts
 */

import { useProductJsonLd } from "./useProductJsonLd";
import { renderHook } from "@testing-library/react";
import type { Product } from "@/types/product";
import { describe, it, expect } from "vitest";

const fakeProduct: Product = {
  id: 1,
  name: "Wireless Mouse",
  description: "A great mouse",
  price: "29.99",
  tags: "",
  imageUrl: "https://example.com/mouse.jpg",
  imageKey: "key1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("useProductJsonLd", () => {
  it("does nothing when product is undefined", () => {
    renderHook(() => useProductJsonLd(undefined));
    expect(document.getElementById("product-jsonld")).toBeNull();
  });

  it("injects correct schema.org Product JSON-LD when a product is given", () => {
    renderHook(() => useProductJsonLd(fakeProduct));

    const script = document.getElementById("product-jsonld");
    const data = JSON.parse(script!.textContent!);

    expect(data["@type"]).toBe("Product");
    expect(data.name).toBe("Wireless Mouse");
    // 🚩 proves the Part 2-A DecimalString-to-number conversion happens
    // correctly here too, matching every other product display in the app
    expect(data.offers.price).toBe("29.99");
    expect(data.offers.priceCurrency).toBe("USD");
  });

  it("removes the JSON-LD script on unmount", () => {
    const { unmount } = renderHook(() => useProductJsonLd(fakeProduct));
    expect(document.getElementById("product-jsonld")).not.toBeNull();

    unmount();

    expect(document.getElementById("product-jsonld")).toBeNull();
  });
});
