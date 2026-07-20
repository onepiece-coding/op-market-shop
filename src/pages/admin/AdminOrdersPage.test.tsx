/**
 * @file frontend/src/pages/admin/AdminOrdersPage.test.tsx
 */

import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminOrdersPage } from "./AdminOrdersPage";
import { MemoryRouter } from "react-router-dom";
import { CacheProvider } from "@/cache";

import userEvent from "@testing-library/user-event";

vi.mock("@/api/orders", () => ({
  listAllOrders: vi.fn(),
  changeOrderStatus: vi.fn(),
}));
vi.mock("@/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks")>();
  return { ...actual, useToast: vi.fn() };
});

import { listAllOrders, changeOrderStatus } from "@/api/orders";
import { useToast } from "@/hooks";

const showToastMock = vi.fn();

function makeOrder(id: number, status: string, userId = 1) {
  return {
    id,
    userId,
    netAmount: "59.98",
    address: "1 Main St",
    status,
    paymentMethod: "CASH_ON_DELIVERY",
    paymentStatus: "PENDING",
    paymentProviderId: null,
    paidAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    user: {
      id: userId,
      name: "Lahcen",
      email: "lahcen@test.com",
      role: "USER",
      emailVerifiedAt: "2026-01-01T00:00:00.000Z",
      defaultShippingAddress: null,
      defaultBillingAddress: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <CacheProvider>
        <AdminOrdersPage />
      </CacheProvider>
    </MemoryRouter>,
  );
}

describe("AdminOrdersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useToast as ReturnType<typeof vi.fn>).mockReturnValue({
      showToast: showToastMock,
    });
  });

  it("shows a loading spinner, then the orders table", async () => {
    (listAllOrders as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [makeOrder(1, "PENDING")],
      pagination: { current: 1, limit: 10, totalPages: 1, results: 1 },
    });

    renderPage();

    expect(await screen.findByText("#1")).toBeInTheDocument();
    // 🚩 now shows REAL customer name + email, not "User #1"
    expect(screen.getByText("Lahcen")).toBeInTheDocument();
    expect(screen.getByText("lahcen@test.com")).toBeInTheDocument();
  });

  it("changing the status filter resets to page 1 and calls listAllOrders with the new filter", async () => {
    const user = userEvent.setup();
    (listAllOrders as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [makeOrder(1, "PENDING")],
      pagination: { current: 1, limit: 10, totalPages: 3, results: 30 },
    });

    renderPage();
    await screen.findByText("#1");

    // page forward first
    await user.click(screen.getByRole("button", { name: "Next page" }));
    await waitFor(() =>
      expect(listAllOrders).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 }),
      ),
    );

    await user.selectOptions(
      screen.getByLabelText("Filter by status"),
      "CANCELED",
    );

    // 🚩 Part 5-C's resetKey fix in action, exactly like ShopPage (8-B)
    await waitFor(() =>
      expect(listAllOrders).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, status: "CANCELED" }),
      ),
    );
  });

  it("changing an order's status calls changeOrderStatus with the correct id and status", async () => {
    const user = userEvent.setup();
    (listAllOrders as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [makeOrder(7, "PENDING")],
      pagination: { current: 1, limit: 10, totalPages: 1, results: 1 },
    });
    (changeOrderStatus as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeOrder(7, "ACCEPTED"),
    );

    renderPage();
    await screen.findByText("#7");

    await user.selectOptions(
      screen.getByLabelText("Change status for order #7"),
      "ACCEPTED",
    );

    await waitFor(() =>
      expect(changeOrderStatus).toHaveBeenCalledWith(7, { status: "ACCEPTED" }),
    );
    expect(showToastMock).toHaveBeenCalledWith(
      "Order status updated.",
      "success",
    );
  });

  it("shows an error toast when changing status fails", async () => {
    const user = userEvent.setup();
    (listAllOrders as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [makeOrder(7, "PENDING")],
      pagination: { current: 1, limit: 10, totalPages: 1, results: 1 },
    });
    (changeOrderStatus as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Server error"),
    );

    renderPage();
    await screen.findByText("#7");

    await user.selectOptions(
      screen.getByLabelText("Change status for order #7"),
      "CANCELED",
    );

    await waitFor(() =>
      expect(showToastMock).toHaveBeenCalledWith(
        "Could not update this order's status. Please try again.",
        "error",
      ),
    );
  });

  it("shows an error banner when listAllOrders fails", async () => {
    (listAllOrders as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Server error"),
    );

    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong while loading orders",
    );
  });

  it("wraps the table in a horizontally-scrollable container", async () => {
    (listAllOrders as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [makeOrder(1, "PENDING")],
      pagination: { current: 1, limit: 10, totalPages: 1, results: 1 },
    });

    renderPage();
    await screen.findByText("#1");

    expect(
      screen.getByTestId("orders-table-wrapper").querySelector("table"),
    ).not.toBeNull();
  });

  // ADD a new test for the fallback path:
  it("falls back to 'User #id' when the user object is missing from the response", async () => {
    const orderWithoutUser = { ...makeOrder(1, "PENDING"), user: undefined };
    (listAllOrders as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [orderWithoutUser],
      pagination: { current: 1, limit: 10, totalPages: 1, results: 1 },
    });

    renderPage();

    expect(await screen.findByText("User #1")).toBeInTheDocument();
  });
});
