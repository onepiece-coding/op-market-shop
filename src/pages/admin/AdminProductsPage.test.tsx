/**
 * @file frontend/src/pages/admin/AdminProductsPage.test.tsx
 */

import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminProductsPage } from "./AdminProductsPage";
import { MemoryRouter } from "react-router-dom";
import { CacheProvider } from "@/cache";

import userEvent from "@testing-library/user-event";

vi.mock("@/api/products", () => ({
  listProducts: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
}));
vi.mock("@/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks")>();
  return { ...actual, useToast: vi.fn() };
});

import { listProducts, createProduct, deleteProduct } from "@/api/products";
import { useToast } from "@/hooks";

const showToastMock = vi.fn();

function makeProduct(id: number, name: string) {
  return {
    id,
    name,
    description: "desc",
    price: "9.99",
    tags: "tag1,tag2",
    imageUrl: null,
    imageKey: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <CacheProvider>
        <AdminProductsPage />
      </CacheProvider>
    </MemoryRouter>,
  );
}

describe("AdminProductsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useToast as ReturnType<typeof vi.fn>).mockReturnValue({
      showToast: showToastMock,
    });
  });

  it("shows a loading spinner, then the product table", async () => {
    (listProducts as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [makeProduct(1, "Mouse")],
      pagination: { current: 1, limit: 10, totalPages: 1, results: 1 },
    });

    renderPage();

    //     expect(screen.getByRole("status")).toBeInTheDocument();
    expect(await screen.findByText("Mouse")).toBeInTheDocument();
  });

  it("calls listProducts — the ADMIN-only endpoint — not searchProducts", async () => {
    (listProducts as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [],
      pagination: { current: 1, limit: 10, totalPages: 0, results: 0 },
    });

    renderPage();

    await waitFor(() =>
      expect(listProducts).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1 }),
      ),
    );
  });

  it("opens the create modal and creates a product", async () => {
    const user = userEvent.setup();
    (listProducts as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [],
      pagination: { current: 1, limit: 10, totalPages: 0, results: 0 },
    });
    (createProduct as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeProduct(1, "New Product"),
    );

    renderPage();
    await screen.findByText("No products yet.");

    await user.click(screen.getByRole("button", { name: "Add product" }));
    await user.type(screen.getByLabelText("Name"), "New Product");
    await user.type(screen.getByLabelText("Description"), "desc");
    await user.type(screen.getByLabelText("Price"), "9.99");
    await user.click(screen.getByRole("button", { name: "Create product" }));

    await waitFor(() => expect(createProduct).toHaveBeenCalled());
    expect(showToastMock).toHaveBeenCalledWith("Product created.", "success");
  });

  it("opens the delete confirmation and deletes a product", async () => {
    const user = userEvent.setup();
    (listProducts as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [makeProduct(1, "Mouse")],
      pagination: { current: 1, limit: 10, totalPages: 1, results: 1 },
    });
    (deleteProduct as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: true,
      message: "Product deleted successfully",
    });

    renderPage();
    await screen.findByText("Mouse");

    await user.click(screen.getByRole("button", { name: "Delete Mouse" }));
    expect(
      screen.getByText(/Are you sure you want to delete "Mouse"/),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(deleteProduct).toHaveBeenCalledWith(1));
    expect(showToastMock).toHaveBeenCalledWith("Product deleted.", "success");
  });

  it("shows an error banner when listProducts fails", async () => {
    (listProducts as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Server error"),
    );

    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong while loading products",
    );
  });

  it("wraps the table in a horizontally-scrollable container, so the table scrolls instead of the whole page", async () => {
    (listProducts as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [makeProduct(1, "Mouse")],
      pagination: { current: 1, limit: 10, totalPages: 1, results: 1 },
    });

    renderPage();
    await screen.findByText("Mouse");

    const wrapper = screen.getByTestId("products-table-wrapper");
    expect(wrapper.querySelector("table")).not.toBeNull();
  });

  it("gives every column header scope='col', for correct screen reader table navigation", async () => {
    (listProducts as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [makeProduct(1, "Mouse")],
      pagination: { current: 1, limit: 10, totalPages: 1, results: 1 },
    });

    renderPage();
    await screen.findByText("Mouse");

    screen.getAllByRole("columnheader").forEach((header) => {
      expect(header).toHaveAttribute("scope", "col");
    });
  });
});
