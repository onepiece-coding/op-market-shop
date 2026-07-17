/**
 * @file frontend/src/pages/shop/OrdersPage.test.tsx
 */

import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { OrdersPage } from "./OrdersPage";
import { CacheProvider } from "@/cache";

import userEvent from "@testing-library/user-event";

vi.mock("@/api/orders", () => ({
  listMyOrders: vi.fn(),
  cancelOrder: vi.fn(),
}));
vi.mock("@/api/payments", () => ({
  retryPayPalPayment: vi.fn(),
}));
vi.mock("@/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks")>();
  return { ...actual, useToast: vi.fn() };
});

import { listMyOrders, cancelOrder } from "@/api/orders";
import { useToast } from "@/hooks";

const showToastMock = vi.fn();

function makeOrder(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1,
    userId: 1,
    netAmount: "59.98",
    address: "1 Main St",
    status: "PENDING",
    paymentMethod: "CASH_ON_DELIVERY",
    paymentStatus: "PENDING",
    paymentProviderId: null,
    paidAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    products: [
      {
        id: 1,
        orderId: 1,
        productId: 5,
        quantity: 2,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <CacheProvider>
        <OrdersPage />
      </CacheProvider>
    </MemoryRouter>,
  );
}

describe("OrdersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useToast as ReturnType<typeof vi.fn>).mockReturnValue({
      showToast: showToastMock,
    });
  });

  it("shows a loading spinner, then renders orders", async () => {
    (listMyOrders as ReturnType<typeof vi.fn>).mockResolvedValue([makeOrder()]);

    renderPage();

    //     expect(screen.getByRole("status")).toBeInTheDocument();
    expect(await screen.findByText("Order #1")).toBeInTheDocument();
  });

  it("shows an empty state with a link back to shopping", async () => {
    (listMyOrders as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    renderPage();

    expect(
      await screen.findByText("You haven't placed any orders yet."),
    ).toBeInTheDocument();
    expect(screen.getByText("Start shopping")).toHaveAttribute("href", "/");
  });

  it("shows an error banner when listMyOrders fails", async () => {
    (listMyOrders as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Server error"),
    );

    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong while loading your orders",
    );
  });

  it("shows line items using productId, since nested product details aren't available (Part 2-A gotcha)", async () => {
    (listMyOrders as ReturnType<typeof vi.fn>).mockResolvedValue([makeOrder()]);

    renderPage();

    expect(await screen.findByText("Product #5 × 2")).toBeInTheDocument();
  });

  it("shows a Cancel button for a PENDING order, but not for a DELIVERED one", async () => {
    (listMyOrders as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeOrder({ id: 1, status: "PENDING" }),
      makeOrder({ id: 2, status: "DELIVERED", products: [] }),
    ]);

    renderPage();
    await screen.findByText("Order #1");

    const pendingCard = screen.getByText("Order #1").closest("article")!;
    const deliveredCard = screen.getByText("Order #2").closest("article")!;

    expect(pendingCard.querySelector("button")).not.toBeNull();
    // the delivered card has no PayPal retry either (cash order), so it
    // should render NO action buttons at all
    expect(deliveredCard.querySelector("button")).toBeNull();
  });

  it("shows a Retry payment button for an unpaid PayPal order", async () => {
    (listMyOrders as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeOrder({ paymentMethod: "PAYPAL", paymentStatus: "PENDING" }),
    ]);

    renderPage();

    expect(
      await screen.findByRole("button", { name: "Retry payment" }),
    ).toBeInTheDocument();
  });

  it("hides the Retry payment button once paymentStatus is COMPLETED", async () => {
    (listMyOrders as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeOrder({
        paymentMethod: "PAYPAL",
        paymentStatus: "COMPLETED",
        status: "DELIVERED",
      }),
    ]);

    renderPage();
    await screen.findByText("Order #1");

    expect(
      screen.queryByRole("button", { name: "Retry payment" }),
    ).not.toBeInTheDocument();
  });

  it("canceling an order calls cancelOrder and keeps the line items visible (proves the merge fix)", async () => {
    const user = userEvent.setup();
    (listMyOrders as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeOrder({ status: "PENDING" }),
    ]);
    // 🚩 deliberately mimics the REAL backend response: no "products" field
    (cancelOrder as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      status: "CANCELED",
      netAmount: "59.98",
      paymentMethod: "CASH_ON_DELIVERY",
      paymentStatus: "PENDING",
    });

    renderPage();
    await screen.findByText("Order #1");
    expect(screen.getByText("Product #5 × 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel order" }));

    await waitFor(() => expect(cancelOrder).toHaveBeenCalledWith(1));
    expect(showToastMock).toHaveBeenCalledWith("Order canceled.", "success");

    // 🚩 THE PROOF: if we'd blindly replaced the cached order with the
    // mutation's response (no products field), this line would now be
    // GONE. It survives because we merged instead of replaced.
    expect(screen.getByText("Product #5 × 2")).toBeInTheDocument();
  });

  it("shows an error toast when canceling fails", async () => {
    const user = userEvent.setup();
    (listMyOrders as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeOrder({ status: "PENDING" }),
    ]);
    (cancelOrder as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Server error"),
    );

    renderPage();
    await screen.findByText("Order #1");

    await user.click(screen.getByRole("button", { name: "Cancel order" }));

    await waitFor(() =>
      expect(showToastMock).toHaveBeenCalledWith(
        "Could not cancel this order. Please try again.",
        "error",
      ),
    );
  });
});
