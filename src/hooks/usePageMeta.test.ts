/**
 * @file frontend/src/hooks/usePageMeta.test.ts
 */

import { renderHook } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { usePageMeta } from "./usePageMeta";
import { DEFAULT_SEO } from "@/config/seo";

describe("usePageMeta", () => {
  it("sets document.title with the site name suffix", () => {
    renderHook(() => usePageMeta({ title: "Shop all products" }));
    expect(document.title).toBe("Shop all products | op-market");
  });

  it("sets the meta description", () => {
    renderHook(() =>
      usePageMeta({ title: "Test", description: "A custom description" }),
    );
    expect(document.querySelector('meta[name="description"]')).toHaveAttribute(
      "content",
      "A custom description",
    );
  });

  it("sets robots to 'index, follow' by default", () => {
    renderHook(() => usePageMeta({ title: "Test" }));
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute(
      "content",
      "index, follow",
    );
  });

  it("sets robots to 'noindex, nofollow' when noIndex is true", () => {
    renderHook(() => usePageMeta({ title: "Cart", noIndex: true }));
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex, nofollow",
    );
  });

  it("sets og:image only when an image is provided", () => {
    renderHook(() => usePageMeta({ title: "Test" }));
    expect(document.querySelector('meta[property="og:image"]')).toBeNull();

    renderHook(() =>
      usePageMeta({ title: "Test", image: "https://example.com/a.jpg" }),
    );
    expect(document.querySelector('meta[property="og:image"]')).toHaveAttribute(
      "content",
      "https://example.com/a.jpg",
    );
  });

  it("resets document.title and description back to the app-wide defaults on unmount", () => {
    const { unmount } = renderHook(() =>
      usePageMeta({ title: "Product X", description: "A specific product" }),
    );

    expect(document.title).toBe("Product X | op-market");

    unmount();

    expect(document.title).toBe(DEFAULT_SEO.title);
    expect(document.querySelector('meta[name="description"]')).toHaveAttribute(
      "content",
      DEFAULT_SEO.description,
    );
  });
});
