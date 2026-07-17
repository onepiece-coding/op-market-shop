/**
 * @file frontend/src/components/ui/modal/modal.test.tsx
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { Modal } from ".";

import userEvent from "@testing-library/user-event";

describe("Modal", () => {
  it("renders nothing at all when isOpen is false", () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </Modal>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the title and children when isOpen is true", () => {
    render(
      <Modal isOpen onClose={() => {}} title="Delete product?">
        <p>This cannot be undone.</p>
      </Modal>,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Delete product?")).toBeInTheDocument();
    expect(screen.getByText("This cannot be undone.")).toBeInTheDocument();
  });

  it("has aria-modal='true' and its heading connected via aria-labelledby", () => {
    render(
      <Modal isOpen onClose={() => {}} title="Delete product?">
        <p>content</p>
      </Modal>,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    const labelledBy = dialog.getAttribute("aria-labelledby");
    // the id it points to should be the REAL heading's id
    expect(document.getElementById(labelledBy!)).toHaveTextContent(
      "Delete product?",
    );
  });

  it("calls onClose when the Escape key is pressed", () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen onClose={handleClose} title="Test">
        <p>content</p>
      </Modal>,
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when clicking the overlay (outside the dialog card)", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    render(
      <Modal isOpen onClose={handleClose} title="Test">
        <p>content</p>
      </Modal>,
    );

    await user.click(screen.getByTestId("modal-overlay"));

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("does NOT call onClose when clicking INSIDE the dialog card", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    render(
      <Modal isOpen onClose={handleClose} title="Test">
        <p>Click me, I am inside</p>
      </Modal>,
    );

    await user.click(screen.getByText("Click me, I am inside"));

    expect(handleClose).not.toHaveBeenCalled();
  });

  it("calls onClose when clicking the × close button", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    render(
      <Modal isOpen onClose={handleClose} title="Test">
        <p>content</p>
      </Modal>,
    );

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("traps Tab focus: pressing Tab on the LAST focusable element wraps to the FIRST", () => {
    render(
      <Modal isOpen onClose={() => {}} title="Test">
        <button>First</button>
        <button>Last</button>
      </Modal>,
    );

    const lastButton = screen.getByText("Last");
    lastButton.focus();
    expect(document.activeElement).toBe(lastButton);

    fireEvent.keyDown(document, { key: "Tab" });

    // our trap should have moved focus back to the close (×) button,
    // which is the actual FIRST focusable element in the dialog
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Close" }),
    );
  });

  it("restores focus to the element that had it BEFORE the modal opened", async () => {
    const user = userEvent.setup();

    // a small harness: a real "Open" button that toggles a real Modal,
    // exactly like a real page would use it
    function Harness() {
      const [isOpen, setIsOpen] = useState(false);
      return (
        <div>
          <button onClick={() => setIsOpen(true)}>Open</button>
          <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Test">
            <p>content</p>
          </Modal>
        </div>
      );
    }

    render(<Harness />);

    const openButton = screen.getByText("Open");
    await user.click(openButton);

    // focus should have moved INTO the modal now
    expect(document.activeElement).not.toBe(openButton);

    await user.click(screen.getByRole("button", { name: "Close" }));

    // and now focus should be back on the ORIGINAL trigger button
    expect(document.activeElement).toBe(openButton);
  });

  it("locks body scroll while open, and restores it after closing", () => {
    const { rerender } = render(
      <Modal isOpen onClose={() => {}} title="Test">
        <p>content</p>
      </Modal>,
    );

    expect(document.body.style.overflow).toBe("hidden");

    rerender(
      <Modal isOpen={false} onClose={() => {}} title="Test">
        <p>content</p>
      </Modal>,
    );

    expect(document.body.style.overflow).not.toBe("hidden");
  });
});
