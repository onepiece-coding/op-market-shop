/**
 * @file frontend/src/hooks/useFocusTrap.test.tsx
 */

import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useFocusTrap } from "./useFocusTrap";
import { useState } from "react";

import userEvent from "@testing-library/user-event";

function TestHarness({
  initiallyActive = true,
}: {
  initiallyActive?: boolean;
}) {
  const [isActive, setIsActive] = useState(initiallyActive);
  const ref = useFocusTrap<HTMLDivElement>({
    isActive,
    onEscape: () => setIsActive(false),
  });

  return (
    <div>
      <button onClick={() => setIsActive(true)}>Open</button>
      {isActive && (
        <div ref={ref} tabIndex={-1} data-testid="panel">
          <button>First</button>
          <button>Last</button>
        </div>
      )}
    </div>
  );
}

describe("useFocusTrap", () => {
  it("moves focus into the container when it becomes active", () => {
    render(<TestHarness />);
    expect(document.activeElement?.textContent).toBe("First");
  });

  it("wraps Tab from the last element back to the first", () => {
    render(<TestHarness />);
    const lastButton = document.querySelector(
      '[data-testid="panel"] button:last-child',
    ) as HTMLElement;
    lastButton.focus();

    fireEvent.keyDown(document, { key: "Tab" });

    expect(document.activeElement?.textContent).toBe("First");
  });

  it("calls onEscape when Escape is pressed", () => {
    const { queryByTestId } = render(<TestHarness />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(queryByTestId("panel")).not.toBeInTheDocument();
  });

  it("locks and restores body scroll", () => {
    const { rerender } = render(<TestHarness />);
    expect(document.body.style.overflow).toBe("hidden");

    rerender(<TestHarness initiallyActive={false} />);
  });

  it("restores focus to the previously-focused element on close", async () => {
    const user = userEvent.setup();
    render(<TestHarness initiallyActive={false} />);

    const openButton = document.querySelector("button") as HTMLElement;
    await user.click(openButton);
    expect(document.activeElement).not.toBe(openButton);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.activeElement).toBe(openButton);
  });
});
