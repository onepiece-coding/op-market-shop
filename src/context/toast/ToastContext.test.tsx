/**
 * @file frontend/src/context/toast/ToastContext.test.tsx
 */

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { useToast } from "@/hooks";

describe("ToastContext", () => {
  it("useToast throws a clear error when used outside of a ToastProvider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    function Broken() {
      useToast();
      return null;
    }

    expect(() => render(<Broken />)).toThrow(
      "useToast must be used inside a <ToastProvider>",
    );

    consoleSpy.mockRestore();
  });
});
