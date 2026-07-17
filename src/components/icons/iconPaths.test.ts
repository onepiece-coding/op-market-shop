/**
 * @file frontend/src/components/icons/iconPaths.test.ts
 */

import { describe, it, expect } from "vitest";
import { iconPaths } from "./iconPaths";

describe("iconPaths", () => {
  it("every icon has non-empty path data", () => {
    // Object.values() gives us every path STRING in the dictionary,
    // regardless of how many icons we add or rename in the future —
    // this test never needs updating when we add icon #16, #17, etc.
    const allPaths = Object.values(iconPaths);

    expect(allPaths.length).toBeGreaterThan(0);
    allPaths.forEach((pathData) => {
      expect(typeof pathData).toBe("string");
      expect(pathData.length).toBeGreaterThan(0);
    });
  });

  it("has no two icon names sharing the exact same path data (would indicate a copy-paste mistake)", () => {
    const allPaths = Object.values(iconPaths);
    // a Set automatically drops duplicates — if the Set's size is SMALLER
    // than the array's length, that means at least two entries were identical
    const uniquePaths = new Set(allPaths);

    expect(uniquePaths.size).toBe(allPaths.length);
  });
});
