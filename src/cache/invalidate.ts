/**
 * @file frontend/src/cache/invalidate.ts
 */

import type { CacheStore } from "./CacheStore";

// STRATEGY 1: remove exactly ONE cache entry, by its exact key.
// The NEXT time any component reads this key, it will find nothing cached
// and trigger a real network fetch (we'll build that "read triggers fetch"
// behavior into useFetch in Part 5-A).
export function invalidateExact(store: CacheStore, key: string): void {
  store.delete(key);
}

// STRATEGY 2: remove EVERY cache entry whose key starts with a given prefix.
// Example: invalidateByPrefix(store, "products:") wipes "products:search?...",
// "products:list?...", AND "products:detail:5" all in one call, because they
// all share that same prefix (this is exactly why we designed our key naming
// convention this way back in Part 4-B).
export function invalidateByPrefix(store: CacheStore, prefix: string): void {
  // ask the store for every key it currently holds...
  const allKeys = store.keys();
  // ...then keep only the ones that start with our target prefix
  const matchingKeys = allKeys.filter((key) => key.startsWith(prefix));
  // delete each matching entry — this correctly reuses store.delete(), which
  // ALSO notifies any listeners subscribed to that key (from Part 4-A)
  matchingKeys.forEach((key) => store.delete(key));
}

// STRATEGY 3: directly REPLACE a cache entry's data using an "updater"
// function — no deleting, no waiting for a network refetch, no loading flicker.
// Use this ONLY when you already have fresh, correct data in hand (usually
// straight from a mutation's own response).
export function updateCacheEntry<T>(
  store: CacheStore,
  key: string,
  // "updater" is a function WE pass in, that receives the CURRENT cached data
  // (or undefined, if nothing was cached yet) and must return the NEW data.
  // Handing control to the caller like this keeps this function generic —
  // it works for a cart array, a single order object, anything at all.
  updater: (current: T | undefined) => T,
): void {
  // read whatever is CURRENTLY cached under this key right now
  const existing = store.get<T>(key);
  // let the caller's updater function decide what the new data should look like
  const newData = updater(existing?.data);
  // save it — this reuses the SAME "set" method from Part 4-A, so listeners
  // watching this key are automatically notified too
  store.set(key, newData);
}
