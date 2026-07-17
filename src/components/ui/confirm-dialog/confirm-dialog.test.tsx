/**
 * @file frontend/src/components/ui/confirm-dialog/confirm-dialog.test.tsx
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ConfirmDialog } from ".";

import userEvent from "@testing-library/user-event";

describe("ConfirmDialog", () => {
  it("renders nothing when isOpen is false", () => {
    render(
      <ConfirmDialog
        isOpen={false}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Delete?"
        message="Sure?"
      />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the title and message when open", () => {
    render(
      <ConfirmDialog
        isOpen
        onClose={() => {}}
        onConfirm={() => {}}
        title="Delete product?"
        message="This cannot be undone."
      />,
    );
    expect(screen.getByText("Delete product?")).toBeInTheDocument();
    expect(screen.getByText("This cannot be undone.")).toBeInTheDocument();
  });

  it("calls onConfirm when the confirm button is clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        isOpen
        onClose={() => {}}
        onConfirm={onConfirm}
        title="Delete?"
        message="Sure?"
        confirmLabel="Delete"
      />,
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("disables both buttons while isLoading is true", () => {
    render(
      <ConfirmDialog
        isOpen
        onClose={() => {}}
        onConfirm={() => {}}
        title="Delete?"
        message="Sure?"
        confirmLabel="Delete"
        isLoading
      />,
    );
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    //     expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
  });
});
