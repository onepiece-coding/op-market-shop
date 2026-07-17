/**
 * @file frontend/src/components/admin/product-form/product-form.test.tsx
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import type { Product } from "@/types/product";
import { ProductForm } from ".";

import userEvent from "@testing-library/user-event";

const existingProduct: Product = {
  id: 1,
  name: "Wireless Mouse",
  description: "A great mouse",
  price: "29.99",
  tags: "electronics,accessories",
  imageUrl: "https://example.com/mouse.jpg",
  imageKey: "key1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("ProductForm", () => {
  it("renders empty fields when creating a new product", () => {
    render(
      <ProductForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        isSubmitting={false}
      />,
    );
    expect(screen.getByLabelText("Name")).toHaveValue("");
    expect(
      screen.getByRole("button", { name: "Create product" }),
    ).toBeInTheDocument();
  });

  it("prefills fields when editing, converting price and tags correctly (Part 2-A gotchas)", () => {
    render(
      <ProductForm
        initialProduct={existingProduct}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        isSubmitting={false}
      />,
    );
    expect(screen.getByLabelText("Name")).toHaveValue("Wireless Mouse");
    expect(screen.getByLabelText("Price")).toHaveValue(29.99);
    expect(screen.getByLabelText("Tags (comma separated)")).toHaveValue(
      "electronics,accessories",
    );
    expect(
      screen.getByRole("button", { name: "Save changes" }),
    ).toBeInTheDocument();
  });

  it("shows a validation error and does not call onSubmit when name is empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <ProductForm
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        isSubmitting={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Create product" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Name is required.",
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows a validation error for a negative price", async () => {
    const user = userEvent.setup();
    render(
      <ProductForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        isSubmitting={false}
      />,
    );

    await user.type(screen.getByLabelText("Name"), "Test");
    await user.type(screen.getByLabelText("Description"), "desc");
    await user.type(screen.getByLabelText("Price"), "-5");
    await user.click(screen.getByRole("button", { name: "Create product" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Price must be a valid, non-negative number.",
    );
  });

  it("splits the comma-separated tags input into a real array on submit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <ProductForm
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        isSubmitting={false}
      />,
    );

    await user.type(screen.getByLabelText("Name"), "Test");
    await user.type(screen.getByLabelText("Description"), "desc");
    await user.type(screen.getByLabelText("Price"), "9.99");
    await user.type(screen.getByLabelText("Tags (comma separated)"), "a, b ,c");
    await user.click(screen.getByRole("button", { name: "Create product" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ tags: ["a", "b", "c"] }),
    );
  });
});
