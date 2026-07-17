/**
 * @file frontend/src/cache/invalidate.test.ts
 */

import { describe, it, expect, vi } from "vitest";
import { CacheStore } from "./CacheStore";
import {
  invalidateExact,
  invalidateByPrefix,
  updateCacheEntry,
} from "./invalidate";

describe("invalidateExact", () => {
  it("removes only the one specified key", () => {
    const store = new CacheStore();
    store.set("users:addresses", [{ id: 1 }]);
    store.set("cart:all", []);

    invalidateExact(store, "users:addresses");

    expect(store.has("users:addresses")).toBe(false);
    // the unrelated key must be completely untouched
    expect(store.has("cart:all")).toBe(true);
  });

  it("notifies listeners subscribed to the removed key", () => {
    const store = new CacheStore();
    const listener = vi.fn();
    store.set("orders:detail:9", { id: 9 });
    store.subscribe("orders:detail:9", listener);

    invalidateExact(store, "orders:detail:9");

    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe("invalidateByPrefix", () => {
  it("removes every key starting with the given prefix", () => {
    const store = new CacheStore();
    store.set("products:search?page=1", []);
    store.set("products:search?page=2", []);
    store.set("products:detail:5", {});
    store.set("cart:all", []); // unrelated — must survive

    invalidateByPrefix(store, "products:");

    expect(store.has("products:search?page=1")).toBe(false);
    expect(store.has("products:search?page=2")).toBe(false);
    expect(store.has("products:detail:5")).toBe(false);
    // this key does NOT start with "products:" — it must remain untouched
    expect(store.has("cart:all")).toBe(true);
  });

  it("does nothing (and does not crash) when no keys match the prefix", () => {
    const store = new CacheStore();
    store.set("cart:all", []);

    expect(() => invalidateByPrefix(store, "products:")).not.toThrow();
    expect(store.has("cart:all")).toBe(true);
  });

  it("notifies listeners for EVERY matching key it removes", () => {
    const store = new CacheStore();
    const listenerA = vi.fn();
    const listenerB = vi.fn();
    store.set("products:search?page=1", []);
    store.set("products:detail:5", {});
    store.subscribe("products:search?page=1", listenerA);
    store.subscribe("products:detail:5", listenerB);

    invalidateByPrefix(store, "products:");

    expect(listenerA).toHaveBeenCalledTimes(1);
    expect(listenerB).toHaveBeenCalledTimes(1);
  });
});

describe("updateCacheEntry", () => {
  it("replaces the data at a key using the updater's return value", () => {
    const store = new CacheStore();
    store.set("cart:all", [{ id: 1, quantity: 2 }]);

    // this mimics EXACTLY what our future useMutate hook will do after
    // changeCartQuantity(1, { quantity: 5 }) succeeds
    updateCacheEntry<Array<{ id: number; quantity: number }>>(
      store,
      "cart:all",
      (current) =>
        (current ?? []).map((item) =>
          item.id === 1 ? { ...item, quantity: 5 } : item,
        ),
    );

    const entry =
      store.get<Array<{ id: number; quantity: number }>>("cart:all");
    expect(entry?.data).toEqual([{ id: 1, quantity: 5 }]);
  });

  it("passes undefined to the updater when nothing was cached at that key yet", () => {
    const store = new CacheStore();

    updateCacheEntry<number[]>(store, "brand:new:key", (current) => {
      // this assertion proves the updater truly received "undefined", as promised
      expect(current).toBeUndefined();
      return [1, 2, 3];
    });

    expect(store.get<number[]>("brand:new:key")?.data).toEqual([1, 2, 3]);
  });

  it("notifies listeners subscribed to the updated key", () => {
    const store = new CacheStore();
    const listener = vi.fn();
    store.set("cart:all", []);
    store.subscribe("cart:all", listener);

    updateCacheEntry<unknown[]>(store, "cart:all", () => [{ id: 1 }]);

    expect(listener).toHaveBeenCalledTimes(1);
  });
});
