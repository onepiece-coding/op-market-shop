/**
 * @file frontend/src/cache/CacheStore.test.ts
 */

import { describe, it, expect, vi } from "vitest";
import { CacheStore } from "./CacheStore";

describe("CacheStore", () => {
  it("returns undefined when reading a key that was never set", () => {
    const store = new CacheStore();
    // nothing was ever saved under "missing-key", so this should be empty
    expect(store.get("missing-key")).toBeUndefined();
  });

  it("saves and reads back data under a key", () => {
    const store = new CacheStore();
    store.set("products:list", [{ id: 1, name: "Phone" }]);

    const entry =
      store.get<Array<{ id: number; name: string }>>("products:list");

    // the entry should exist, and its "data" field should match what we saved
    expect(entry?.data).toEqual([{ id: 1, name: "Phone" }]);
    // timestamp should be a real number (milliseconds), not missing
    expect(typeof entry?.timestamp).toBe("number");
  });

  it("has() correctly reports whether a key exists", () => {
    const store = new CacheStore();
    expect(store.has("cart")).toBe(false);

    store.set("cart", []);
    expect(store.has("cart")).toBe(true);
  });

  it("delete() removes a saved entry completely", () => {
    const store = new CacheStore();
    store.set("cart", [{ id: 1 }]);
    expect(store.has("cart")).toBe(true);

    store.delete("cart");

    expect(store.has("cart")).toBe(false);
    expect(store.get("cart")).toBeUndefined();
  });

  it("calls a subscribed listener when its key's data is set", () => {
    const store = new CacheStore();
    // vi.fn() creates a FAKE function we can track — did it get called? how many times?
    const listener = vi.fn();

    store.subscribe("cart", listener);
    store.set("cart", [{ id: 1 }]);

    // the listener should have fired exactly once, from that one .set() call
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("calls a subscribed listener when its key's data is deleted", () => {
    const store = new CacheStore();
    const listener = vi.fn();

    store.set("cart", [{ id: 1 }]); // set happens BEFORE subscribing, so no call yet
    store.subscribe("cart", listener);
    store.delete("cart");

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("does NOT call a listener subscribed to a DIFFERENT key", () => {
    const store = new CacheStore();
    const cartListener = vi.fn();
    const productsListener = vi.fn();

    store.subscribe("cart", cartListener);
    store.subscribe("products:list", productsListener);

    // only change "cart" — "products:list" should be completely unaffected
    store.set("cart", [{ id: 1 }]);

    expect(cartListener).toHaveBeenCalledTimes(1);
    expect(productsListener).not.toHaveBeenCalled();
  });

  it("calls ALL listeners subscribed to the same key", () => {
    const store = new CacheStore();
    const listenerA = vi.fn();
    const listenerB = vi.fn();

    store.subscribe("cart", listenerA);
    store.subscribe("cart", listenerB);
    store.set("cart", [{ id: 1 }]);

    // BOTH listeners watching "cart" should have been notified
    expect(listenerA).toHaveBeenCalledTimes(1);
    expect(listenerB).toHaveBeenCalledTimes(1);
  });

  it("stops calling a listener once it has unsubscribed", () => {
    const store = new CacheStore();
    const listener = vi.fn();

    // subscribe() returns the "unsubscribe" function — we save it here
    const unsubscribe = store.subscribe("cart", listener);

    store.set("cart", [{ id: 1 }]);
    expect(listener).toHaveBeenCalledTimes(1); // first change: still listening

    unsubscribe(); // stop listening now

    store.set("cart", [{ id: 2 }]);
    // the listener should STILL only have 1 total call — the second .set()
    // happened AFTER we unsubscribed, so it should not have fired again
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("keys() returns every currently cached key", () => {
    const store = new CacheStore();
    store.set("products:list", []);
    store.set("cart:all", []);

    const keys = store.keys();

    expect(keys).toContain("products:list");
    expect(keys).toContain("cart:all");
    expect(keys).toHaveLength(2);
  });

  it("keys() no longer includes a key after it has been deleted", () => {
    const store = new CacheStore();
    store.set("cart:all", []);
    store.delete("cart:all");

    expect(store.keys()).not.toContain("cart:all");
  });

  it("keys() returns an empty array when nothing has been cached yet", () => {
    const store = new CacheStore();
    expect(store.keys()).toEqual([]);
  });

  it("clear() removes every cached entry", () => {
    const store = new CacheStore();
    store.set("cart:all", []);
    store.set("products:list", []);

    store.clear();

    expect(store.has("cart:all")).toBe(false);
    expect(store.has("products:list")).toBe(false);
    expect(store.keys()).toEqual([]);
  });

  it("clear() notifies every listener across every different key", () => {
    const store = new CacheStore();
    const cartListener = vi.fn();
    const productsListener = vi.fn();
    store.set("cart:all", []);
    store.set("products:list", []);
    store.subscribe("cart:all", cartListener);
    store.subscribe("products:list", productsListener);

    store.clear();

    expect(cartListener).toHaveBeenCalledTimes(1);
    expect(productsListener).toHaveBeenCalledTimes(1);
  });

  it("clear() does nothing and does not throw when the cache is already empty", () => {
    const store = new CacheStore();
    expect(() => store.clear()).not.toThrow();
  });
});
