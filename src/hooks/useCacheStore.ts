/**
 * @file frontend/src/hooks/useCacheStore.ts
 */

import { CacheContext, CacheStore } from "@/cache";
import { useContext } from "react";

// A small custom hook so components never need to import "useContext" and
// "CacheContext" directly themselves — they just call useCacheStore() and
// immediately get the shared store.
export function useCacheStore(): CacheStore {
  const store = useContext(CacheContext);

  // if "store" comes back null, it means this component was rendered
  // OUTSIDE of a <CacheProvider> somewhere above it — a real mistake.
  // We throw a CLEAR error immediately here, instead of letting a
  // confusing "cannot read property of null" crash happen randomly,
  // deep inside some unrelated component later.
  if (!store) {
    throw new Error("useCacheStore must be used inside a <CacheProvider>");
  }

  return store;
}
