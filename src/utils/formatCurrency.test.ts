/**
 * @file frontend/src/utils/formatCurrency.test.ts
 */

import { formatCurrency } from "./formatCurrency";
import { describe, it, expect } from "vitest";

describe("formatCurrency", () => {
  it("formats a whole-dollar-and-cents amount correctly", () => {
    expect(formatCurrency(49.99)).toBe("$49.99");
  });

  it("formats zero correctly", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("rounds to exactly 2 decimal places", () => {
    expect(formatCurrency(49.999)).toBe("$50.00");
  });

  it("adds thousands separators for large amounts", () => {
    expect(formatCurrency(1234.5)).toBe("$1,234.50");
  });
});
