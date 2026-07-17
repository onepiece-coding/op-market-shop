/**
 * @file frontend/src/components/shop/product-card/product-card.test.tsx
 */

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { Product } from "@/types/product";
import { describe, it, expect } from "vitest";
import { ProductCard } from ".";

// a realistic fake Product, matching EXACTLY the shape our real backend
// sends (price as a STRING, tags as a comma-joined STRING) — this is the
// same discipline we used for our api/*.test.ts files back in Part 3
const baseProduct: Product = {
  id: 1,
  name: "Wireless Headphones",
  description: "Great sound",
  price: "49.99",
  tags: "electronics,audio,sale",
  imageUrl: "https://example.com/headphones.jpg",
  imageKey: "abc123",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function renderCard(product: Product) {
  return render(
    <MemoryRouter>
      <ProductCard product={product} />
    </MemoryRouter>,
  );
}

describe("ProductCard", () => {
  it("renders the product name", () => {
    renderCard(baseProduct);
    expect(screen.getByText("Wireless Headphones")).toBeInTheDocument();
  });

  it("converts the string price into a formatted currency display", () => {
    renderCard(baseProduct);
    expect(screen.getByText("$49.99")).toBeInTheDocument();
  });

  it("splits the comma-joined tags string into separate tag pills", () => {
    renderCard(baseProduct);
    expect(screen.getByText("electronics")).toBeInTheDocument();
    expect(screen.getByText("audio")).toBeInTheDocument();
    expect(screen.getByText("sale")).toBeInTheDocument();
    // confirms it's genuinely 3 SEPARATE items, not one giant unsplit string
    expect(
      screen.queryByText("electronics,audio,sale"),
    ).not.toBeInTheDocument();
  });

  it("renders a real <img> with the product name as alt text when imageUrl exists", () => {
    renderCard(baseProduct);
    const image = screen.getByAltText("Wireless Headphones");
    expect(image).toHaveAttribute("src", "https://example.com/headphones.jpg");
  });

  it("renders a placeholder instead of a broken image when imageUrl is null", () => {
    renderCard({ ...baseProduct, imageUrl: null, imageKey: null });

    expect(screen.getByText("No image")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("links to the correct product detail url", () => {
    renderCard(baseProduct);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/products/1");
  });

  it("sets loading='lazy' and explicit width/height on the product image (Gap 2 fix)", () => {
    renderCard(baseProduct);
    const image = screen.getByAltText("Wireless Headphones");

    expect(image).toHaveAttribute("loading", "lazy");
    expect(image).toHaveAttribute("width", "400");
    expect(image).toHaveAttribute("height", "400");
  });
});
