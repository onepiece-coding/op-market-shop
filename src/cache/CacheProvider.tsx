/**
 * @file frontend/src/cache/CacheProvider.ts
 */

import { useState, type ReactNode } from "react";
import { CacheContext } from "./CacheContext";
import { CacheStore } from "./CacheStore";

interface CacheProviderProps {
  children: ReactNode; // whatever components we wrap with this provider
}

export function CacheProvider({ children }: CacheProviderProps) {
  // WHY useState here, instead of simply writing "const store = new CacheStore()"?
  // Every time THIS component re-renders, its ENTIRE function body runs again.
  // Without useState, a plain "new CacheStore()" would create a BRAND NEW,
  // completely empty store on every single re-render — wiping out all our
  // cached data constantly. useState guarantees React keeps the SAME value
  // across re-renders, only creating it once.
  //
  // WHY the "() => new CacheStore()" ARROW FUNCTION form specifically
  // (this pattern is called a "lazy initializer"), instead of
  // "useState(new CacheStore())"?
  // React only actually NEEDS the store on the very first render — after
  // that, it reuses the same one forever. But if we wrote
  // "useState(new CacheStore())", JavaScript would still construct a
  // brand new CacheStore object on EVERY single re-render (just to
  // immediately throw it away, since useState ignores it after render #1).
  // Wrapping it in "() => ..." tells React "only call this function if
  // you actually need a fresh value" — meaning it only truly runs once.
  const [store] = useState<CacheStore>(() => new CacheStore());

  return (
    <CacheContext.Provider value={store}>{children}</CacheContext.Provider>
  );
}
