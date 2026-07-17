/**
 * @file frontend/src/utils/queryString.test.ts
 */

import { buildQueryString } from "./queryString";
import { describe, it, expect } from "vitest";

describe("buildQueryString", () => {
  it("builds a query string from multiple values", () => {
    const result = buildQueryString({ page: 2, limit: 10 });
    // we check with "toBe" here because we know the EXACT expected string
    expect(result).toBe("?page=2&limit=10");
  });

  it("skips undefined values entirely", () => {
    const result = buildQueryString({ page: 1, q: undefined });
    // "q" should be completely missing from the output, not "?q=undefined"
    expect(result).toBe("?page=1");
  });

  it("skips null values entirely", () => {
    const result = buildQueryString({ page: 1, q: null });
    expect(result).toBe("?page=1");
  });

  it("skips empty string values entirely", () => {
    const result = buildQueryString({ page: 1, q: "" });
    expect(result).toBe("?page=1");
  });

  it("returns an empty string when there is nothing valid to include", () => {
    const result = buildQueryString({ q: undefined, page: null });
    // no "?" at all when there's truly nothing to add
    expect(result).toBe("");
  });

  it("returns an empty string when given an empty object", () => {
    const result = buildQueryString({});
    expect(result).toBe("");
  });
});
