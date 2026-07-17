/**
 * @file frontend/src/pages/shop/ShopPage.test.tsx
 */

import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { CacheProvider } from "@/cache";
import { ShopPage } from "./ShopPage";

vi.mock("@/api/products", () => ({
  searchProducts: vi.fn(),
}));

import { searchProducts } from "@/api/products";

function makePage(
  products: Array<{ id: number; name: string }>,
  totalPages = 1,
) {
  return {
    data: products.map((p) => ({
      id: p.id,
      name: p.name,
      description: "desc",
      price: "9.99",
      tags: "",
      imageUrl: null,
      imageKey: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    })),
    pagination: { current: 1, limit: 12, totalPages, results: totalPages * 12 },
  };
}

function renderShopPage() {
  return render(
    <MemoryRouter>
      <CacheProvider>
        <ShopPage />
      </CacheProvider>
    </MemoryRouter>,
  );
}

describe("ShopPage", () => {
  it("shows an empty-state message when there are no products at all", async () => {
    (searchProducts as ReturnType<typeof vi.fn>).mockResolvedValue(
      makePage([]),
    );

    renderShopPage();

    expect(
      await screen.findByText("No products available yet."),
    ).toBeInTheDocument();
  });

  it("calls searchProducts with q='' on initial load (browses ALL products)", async () => {
    (searchProducts as ReturnType<typeof vi.fn>).mockResolvedValue(
      makePage([{ id: 1, name: "Phone" }]),
    );

    renderShopPage();

    await waitFor(() =>
      expect(searchProducts).toHaveBeenCalledWith(
        expect.objectContaining({ q: "", page: 1 }),
      ),
    );
  });

  it("shows an error banner when searchProducts fails", async () => {
    (searchProducts as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Server error"),
    );

    renderShopPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong while loading products",
    );
  });
});
