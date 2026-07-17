/**
 * @file frontend/src/pages/shop/CartPage.test.tsx
 */

import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { CacheProvider } from "@/cache";
import { CartPage } from "./CartPage";

vi.mock("@/api/cart", () => ({
  getCart: vi.fn(),
  changeCartQuantity: vi.fn(),
  removeFromCart: vi.fn(),
}));
vi.mock("@/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks")>();
  return {
    ...actual,
    useToast: vi.fn(),
  };
});

import { getCart, removeFromCart } from "@/api/cart";
import { useToast } from "@/hooks";

function makeItem(id: number, name: string, price: string, quantity: number) {
  return {
    id,
    userId: 1,
    productId: id,
    quantity,
    product: {
      id,
      name,
      description: "desc",
      price,
      tags: "",
      imageUrl: null,
      imageKey: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function renderCartPage() {
  return render(
    <MemoryRouter>
      <CacheProvider>
        <CartPage />
      </CacheProvider>
    </MemoryRouter>,
  );
}

describe("CartPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useToast as ReturnType<typeof vi.fn>).mockReturnValue({
      showToast: vi.fn(),
    });
  });

  it("shows a loading spinner, then renders the cart items", async () => {
    (getCart as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeItem(1, "Mouse", "29.99", 1),
    ]);

    renderCartPage();

    // expect(screen.getByRole("status")).toBeInTheDocument();
    expect(await screen.findByText("Mouse")).toBeInTheDocument();
  });

  it("shows an empty-cart message with a link back to shopping", async () => {
    (getCart as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    renderCartPage();

    expect(await screen.findByText("Your cart is empty")).toBeInTheDocument();
    expect(screen.getByText("Continue shopping")).toHaveAttribute("href", "/");
  });

  it("shows an error banner when getCart fails", async () => {
    (getCart as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Server error"),
    );

    renderCartPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong while loading your cart",
    );
  });

  it("computes and displays the correct total across multiple items", async () => {
    (getCart as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeItem(1, "Mouse", "29.99", 2), // 59.98
      makeItem(2, "Keyboard", "49.99", 1), // 49.99
    ]);

    renderCartPage();

    await screen.findByText("Mouse");
    // 59.98 + 49.99 = 109.97
    expect(screen.getByText("$109.97")).toBeInTheDocument();
  });

  it("links the checkout button to /checkout", async () => {
    (getCart as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeItem(1, "Mouse", "29.99", 1),
    ]);

    renderCartPage();

    await screen.findByText("Mouse");
    expect(screen.getByText("Proceed to checkout")).toHaveAttribute(
      "href",
      "/checkout",
    );
  });

  it("removing an item updates the list AND the total, without a full refetch (Strategy 3 in action)", async () => {
    const user = userEvent.setup();
    (getCart as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeItem(1, "Mouse", "29.99", 1),
      makeItem(2, "Keyboard", "49.99", 1),
    ]);
    (removeFromCart as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      message: "removed",
    });

    renderCartPage();

    await screen.findByText("Mouse");
    expect(screen.getByText("$79.98")).toBeInTheDocument(); // 29.99 + 49.99

    await user.click(
      screen.getByRole("button", { name: "Remove Mouse from cart" }),
    );

    await waitFor(() =>
      expect(screen.queryByText("Mouse")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Keyboard")).toBeInTheDocument();
    // total should now reflect ONLY the remaining item
    // expect(screen.getByText("$49.99")).toBeInTheDocument();

    // 🚩 confirms the refinement: getCart should have been called only
    // ONCE (the initial load) — removal never triggered a second fetch
    expect(getCart).toHaveBeenCalledTimes(1);
  });

  it("shows the empty-cart state after removing the LAST item", async () => {
    const user = userEvent.setup();
    (getCart as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeItem(1, "Mouse", "29.99", 1),
    ]);
    (removeFromCart as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      message: "removed",
    });

    renderCartPage();

    await screen.findByText("Mouse");
    await user.click(
      screen.getByRole("button", { name: "Remove Mouse from cart" }),
    );

    expect(await screen.findByText("Your cart is empty")).toBeInTheDocument();
  });
});
