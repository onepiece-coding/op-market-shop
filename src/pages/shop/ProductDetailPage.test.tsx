/**
 * @file frontend/src/pages/shop/ProductDetailPage.test.tsx
 */

import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProductDetailPage } from "./ProductDetailPage";
import { ApiError } from "@/api/ApiError";
import { CacheProvider } from "@/cache";

import userEvent from "@testing-library/user-event";

vi.mock("@/api/products", () => ({
  getProductById: vi.fn(),
}));
vi.mock("@/api/cart", () => ({
  addToCart: vi.fn(),
}));
vi.mock("@/hooks", () => ({
  useProductJsonLd: vi.fn(),
  usePageMeta: vi.fn(),
  useToast: vi.fn(),
  useAuth: vi.fn(),
}));

import { getProductById } from "@/api/products";
import { useAuth, useToast } from "@/hooks";
import { addToCart } from "@/api/cart";

const fakeProduct = {
  id: 5,
  name: "Wireless Mouse",
  description: "A great mouse",
  price: "29.99",
  tags: "electronics,accessories",
  imageUrl: "https://example.com/mouse.jpg",
  imageKey: "key123",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const showToastMock = vi.fn();

function renderPage(path = "/products/5") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <CacheProvider>
        <Routes>
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/" element={<div>Shop Page</div>} />
        </Routes>
      </CacheProvider>
    </MemoryRouter>,
  );
}

describe("ProductDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useToast as ReturnType<typeof vi.fn>).mockReturnValue({
      showToast: showToastMock,
    });
  });

  it("shows an invalid-link message WITHOUT calling the API, for a non-numeric id", () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
    });

    renderPage("/products/abc");

    expect(screen.getByText("Product not found")).toBeInTheDocument();
    expect(
      screen.getByText("This product link looks incorrect."),
    ).toBeInTheDocument();
    expect(getProductById).not.toHaveBeenCalled();
  });

  it("calls getProductById with the correctly-parsed numeric id", async () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
    });
    (getProductById as ReturnType<typeof vi.fn>).mockResolvedValue(fakeProduct);

    renderPage("/products/5");

    await waitFor(() => expect(getProductById).toHaveBeenCalledWith(5));
  });

  it("shows a distinct 'not found' message specifically for a 404 error", async () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
    });
    (getProductById as ReturnType<typeof vi.fn>).mockRejectedValue(
      new ApiError("Product not found!", 404),
    );

    renderPage();

    expect(await screen.findByText("Product not found")).toBeInTheDocument();
    expect(
      screen.getByText("This product may have been removed or never existed."),
    ).toBeInTheDocument();
  });

  it("shows a generic error banner for a non-404 failure", async () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
    });
    (getProductById as ReturnType<typeof vi.fn>).mockRejectedValue(
      new ApiError("Internal Server Error", 500),
    );

    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong while loading this product",
    );
    // confirms this is genuinely the DIFFERENT message from the 404 case
    expect(screen.queryByText("Product not found")).not.toBeInTheDocument();
  });

  it("redirects a LOGGED-OUT visitor to /login instead of calling addToCart", async () => {
    const user = userEvent.setup();
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
    });
    (getProductById as ReturnType<typeof vi.fn>).mockResolvedValue(fakeProduct);

    renderPage();
    await screen.findByText("Wireless Mouse");

    await user.click(screen.getByRole("button", { name: "Add to cart" }));

    expect(await screen.findByText("Login Page")).toBeInTheDocument();
    expect(addToCart).not.toHaveBeenCalled();
  });

  it("calls addToCart with the correct productId and quantity for a LOGGED-IN visitor", async () => {
    const user = userEvent.setup();
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
    });
    (getProductById as ReturnType<typeof vi.fn>).mockResolvedValue(fakeProduct);
    (addToCart as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      productId: 5,
      quantity: 2,
    });

    renderPage();
    await screen.findByText("Wireless Mouse");

    // bump quantity to 2 before adding
    await user.click(screen.getByRole("button", { name: "Increase quantity" }));
    await user.click(screen.getByRole("button", { name: "Add to cart" }));

    await waitFor(() =>
      expect(addToCart).toHaveBeenCalledWith({ productId: 5, quantity: 2 }),
    );
  });

  it("shows a success toast after successfully adding to cart", async () => {
    const user = userEvent.setup();
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
    });
    (getProductById as ReturnType<typeof vi.fn>).mockResolvedValue(fakeProduct);
    (addToCart as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      productId: 5,
      quantity: 1,
    });

    renderPage();
    await screen.findByText("Wireless Mouse");

    await user.click(screen.getByRole("button", { name: "Add to cart" }));

    await waitFor(() =>
      expect(showToastMock).toHaveBeenCalledWith("Added to cart!", "success"),
    );
  });

  it.skip("shows an error toast when addToCart fails for a logged-in visitor", async () => {
    const user = userEvent.setup();
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
    });
    (getProductById as ReturnType<typeof vi.fn>).mockResolvedValue(fakeProduct);
    (addToCart as ReturnType<typeof vi.fn>).mockRejectedValue(
      new ApiError("Server error", 500),
    );

    renderPage();
    await screen.findByText("Wireless Mouse");

    await user.click(screen.getByRole("button", { name: "Add to cart" }));

    await waitFor(() =>
      expect(showToastMock).toHaveBeenCalledWith(
        "Could not add this item to your cart. Please try again.",
        "error",
      ),
    );
  });

  it("sets fetchPriority='high' (NOT lazy) on the hero image, since it's likely the page's LCP element", async () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
    });
    (getProductById as ReturnType<typeof vi.fn>).mockResolvedValue(fakeProduct);

    renderPage();

    const image = await screen.findByAltText("Wireless Mouse");
    expect(image).toHaveAttribute("fetchpriority", "high");
    expect(image).not.toHaveAttribute("loading", "lazy");
  });
});
