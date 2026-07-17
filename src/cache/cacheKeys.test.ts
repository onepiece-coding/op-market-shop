/**
 * @file frontend/src/cache/cacheKeys.test.ts
 */

import { buildCacheKey, cacheKeys } from "./cacheKeys";
import { describe, it, expect } from "vitest";

describe("buildCacheKey", () => {
  it("returns just the resource name when no params are given", () => {
    expect(buildCacheKey("products:search")).toBe("products:search");
  });

  it("returns just the resource name when params is an empty object", () => {
    expect(buildCacheKey("products:search", {})).toBe("products:search");
  });

  it("builds a sorted key=value string from the given params", () => {
    const result = buildCacheKey("products:search", { limit: 10, page: 2 });
    // "limit" comes before "page" alphabetically, so it should appear FIRST,
    // even though "limit" was written SECOND in our input object
    expect(result).toBe("products:search?limit=10&page=2");
  });

  it("skips undefined, null, and empty-string values", () => {
    const result = buildCacheKey("products:search", {
      page: 1,
      q: undefined,
      limit: null,
    } as never); // "as never" just quiets TypeScript for this deliberately-messy test input
    expect(result).toBe("products:search?page=1");
  });

  it("THE MOST IMPORTANT TEST: produces the SAME key regardless of param order", () => {
    // this is the exact bug scenario described above — two components calling
    // the same search with the same values, but typed in a different order
    const keyFromComponentA = buildCacheKey("products:search", {
      page: 1,
      limit: 10,
    });
    const keyFromComponentB = buildCacheKey("products:search", {
      limit: 10,
      page: 1,
    });

    // if this passes, our cache will correctly treat these as the SAME entry
    expect(keyFromComponentA).toBe(keyFromComponentB);
  });
});

describe("cacheKeys", () => {
  it("products.search() builds a sorted key with multiple params", () => {
    const result = cacheKeys.products.search({
      q: "phone",
      limit: 10,
      page: 2,
    });
    // alphabetical order: limit, page, q
    expect(result).toBe("products:search?limit=10&page=2&q=phone");
  });

  it("products.search() with no arguments still works (our public Shop page's default call)", () => {
    expect(cacheKeys.products.search()).toBe("products:search");
  });

  it("products.list() uses a DIFFERENT prefix than products.search()", () => {
    // this matters because listProducts() is admin-only (Part 3-C-2's gotcha) —
    // its cached data should never be confused with the public search results
    const searchKey = cacheKeys.products.search({ page: 1 });
    const listKey = cacheKeys.products.list({ page: 1 });
    expect(searchKey).not.toBe(listKey);
  });

  it("products.detail() builds a simple id-based key", () => {
    expect(cacheKeys.products.detail(5)).toBe("products:detail:5");
  });

  it("cart.all() always returns the exact same fixed key", () => {
    expect(cacheKeys.cart.all()).toBe("cart:all");
  });

  it("orders.mine() and orders.detail() build distinct, correct keys", () => {
    expect(cacheKeys.orders.mine()).toBe("orders:mine");
    expect(cacheKeys.orders.detail(9)).toBe("orders:detail:9");
  });

  it("orders.adminAll() includes sorted filter params", () => {
    const result = cacheKeys.orders.adminAll({ status: "PENDING", page: 1 });
    expect(result).toBe("orders:admin:all?page=1&status=PENDING");
  });

  it("orders.byUser() embeds the userId directly in the key, plus sorted params", () => {
    const result = cacheKeys.orders.byUser(4, { page: 1 });
    expect(result).toBe("orders:admin:byUser:4?page=1");
  });

  it("users.me() and users.addresses() return their fixed keys", () => {
    expect(cacheKeys.users.me()).toBe("auth:me");
    expect(cacheKeys.users.addresses()).toBe("users:addresses");
  });

  it("users.list() and users.detail() build correctly", () => {
    expect(cacheKeys.users.list({ page: 2 })).toBe("users:list?page=2");
    expect(cacheKeys.users.detail(7)).toBe("users:detail:7");
  });
});
