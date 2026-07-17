/**
 * @file frontend/src/components/shop/cart-item-row/cart-item-row.test.tsx
 */

import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { CartItem } from "@/types/cart";
import { CacheProvider } from "@/cache";
import { CartItemRow } from ".";

vi.mock("@/api/cart", () => ({
  changeCartQuantity: vi.fn(),
  removeFromCart: vi.fn(),
}));
// FIX: keep every REAL export from "@/hooks" (useMutate, useAuth, useFetch...)
// and only replace "useToast" with our fake. This is what "partially
// mocking a module" means — the error message literally told us the syntax.
vi.mock("@/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks")>();
  return {
    ...actual,
    useToast: vi.fn(),
  };
});

import { changeCartQuantity, removeFromCart } from "@/api/cart";
import { useToast } from "@/hooks";

const showToastMock = vi.fn();

const fakeItem: CartItem = {
  id: 10,
  userId: 1,
  productId: 5,
  quantity: 2,
  product: {
    id: 5,
    name: "Wireless Mouse",
    description: "desc",
    price: "29.99",
    tags: "",
    imageUrl: "https://example.com/mouse.jpg",
    imageKey: "key1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function renderRow(item: CartItem = fakeItem) {
  return render(
    <MemoryRouter>
      <CacheProvider>
        <CartItemRow item={item} />
      </CacheProvider>
    </MemoryRouter>,
  );
}

describe("CartItemRow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useToast as ReturnType<typeof vi.fn>).mockReturnValue({
      showToast: showToastMock,
    });
  });

  it("renders the product name, unit price, and line total", () => {
    renderRow();

    expect(screen.getByText("Wireless Mouse")).toBeInTheDocument();
    expect(screen.getByText("$29.99 each")).toBeInTheDocument();
    // line total: 29.99 * 2 = 59.98
    expect(screen.getByText("$59.98")).toBeInTheDocument();
  });

  it("calls changeCartQuantity with the item's id and the new quantity when increased", async () => {
    const user = userEvent.setup();
    (changeCartQuantity as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...fakeItem,
      quantity: 3,
    });

    renderRow();

    await user.click(screen.getByRole("button", { name: "Increase quantity" }));

    await waitFor(() =>
      expect(changeCartQuantity).toHaveBeenCalledWith(10, { quantity: 3 }),
    );
  });

  it("disables the quantity control while a change is in flight", async () => {
    const user = userEvent.setup();
    // a promise we control by hand, so we can inspect the "in progress" state
    let resolveChange: (value: unknown) => void = () => {};
    (changeCartQuantity as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise((resolve) => {
        resolveChange = resolve;
      }),
    );

    renderRow();

    await user.click(screen.getByRole("button", { name: "Increase quantity" }));

    expect(screen.getByLabelText("Quantity Input")).toBeDisabled();

    resolveChange({ ...fakeItem, quantity: 3 });
    await waitFor(() =>
      expect(screen.getByLabelText("Quantity Input")).not.toBeDisabled(),
    );
  });

  it("shows an error toast and re-enables the control when changing quantity fails", async () => {
    const user = userEvent.setup();
    (changeCartQuantity as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Server error"),
    );

    renderRow();

    await user.click(screen.getByRole("button", { name: "Increase quantity" }));

    await waitFor(() =>
      expect(showToastMock).toHaveBeenCalledWith(
        "Could not update quantity. Please try again.",
        "error",
      ),
    );
    expect(screen.getByLabelText("Quantity Input")).not.toBeDisabled();
  });

  it("calls removeFromCart with the item's id when the remove button is clicked", async () => {
    const user = userEvent.setup();
    (removeFromCart as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      message: "removed",
    });

    renderRow();

    await user.click(
      screen.getByRole("button", { name: "Remove Wireless Mouse from cart" }),
    );

    await waitFor(() => expect(removeFromCart).toHaveBeenCalledWith(10));
  });

  it("shows an error toast when removing fails", async () => {
    const user = userEvent.setup();
    (removeFromCart as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Server error"),
    );

    renderRow();

    await user.click(
      screen.getByRole("button", { name: "Remove Wireless Mouse from cart" }),
    );

    await waitFor(() =>
      expect(showToastMock).toHaveBeenCalledWith(
        "Could not remove this item. Please try again.",
        "error",
      ),
    );
  });

  it("renders a placeholder instead of a broken image when imageUrl is null", () => {
    renderRow({
      ...fakeItem,
      product: { ...fakeItem.product, imageUrl: null, imageKey: null },
    });

    expect(screen.getByText("No image")).toBeInTheDocument();
  });
});
