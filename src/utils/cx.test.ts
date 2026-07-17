/**
 * @file frontend/src/utils/cx.test.ts
 */

import { describe, it, expect } from "vitest";
import { cx } from "./cx";

describe("cx", () => {
  it("joins multiple truthy class names with a space", () => {
    expect(cx("a", "b", "c")).toBe("a b c");
  });

  it("skips false, null, and undefined values", () => {
    expect(cx("a", false, null, undefined, "b")).toBe("a b");
  });

  it("returns an empty string when nothing given is truthy", () => {
    expect(cx(false, null, undefined)).toBe("");
  });

  it("supports the exact conditional-class pattern our components rely on", () => {
    const isActive = true;
    const isDisabled = false;
    // this is EXACTLY how Button.tsx uses cx() — proving the pattern works
    expect(cx("base", isActive && "active", isDisabled && "disabled")).toBe(
      "base active",
    );
  });
});
