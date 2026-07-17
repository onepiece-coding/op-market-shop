/**
 * @file frontend/src/hooks/useFetch.ts
 */

import { useCacheStore } from "./useCacheStore";
import { dedupeRequest } from "@/cache";
import {
  useSyncExternalStore,
  useCallback,
  useEffect,
  useState,
  useRef,
} from "react";

// 30 seconds felt like the right default: short enough that data never
// feels wildly out of date, long enough that clicking between a few pages
// doesn't trigger a fresh network request every single time.
const DEFAULT_STALE_TIME_MS = 30_000;

export interface UseFetchOptions {
  // how long (in ms) cached data is considered "fresh" before we refetch it
  staleTime?: number;
  // lets a caller SKIP fetching entirely — useful later for things like
  // "only fetch this order once we know the user is actually logged in"
  enabled?: boolean;
}

export interface UseFetchResult<T> {
  data: T | undefined; // undefined until the first successful fetch
  isLoading: boolean; // true ONLY on the very first load (nothing to show yet)
  isValidating: boolean; // true any time a fetch is happening, even a silent background one
  error: Error | null;
  refetch: () => void; // lets a component force a fresh fetch on demand
}

/**
 * useFetch connects a component to ONE cache key. It automatically:
 * - shows cached data instantly if it's still fresh
 * - fetches fresh data if the cache is empty or stale
 * - re-renders the component whenever that key's cached data changes,
 *   EVEN IF the change was caused by a totally different component
 *   (e.g. a cache invalidation from Part 4-C)
 */
export function useFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseFetchOptions = {},
): UseFetchResult<T> {
  const store = useCacheStore();
  const { staleTime = DEFAULT_STALE_TIME_MS, enabled = true } = options;

  /**
   * Word check — useSyncExternalStore: This is a built-in React hook, specifically designed for exactly our situation: "I have some data living OUTSIDE of React (our CacheStore class), and I want a component to automatically re-render whenever that outside data changes." You give it two functions:
   * 1. subscribe — "React, please call this function whenever the external data changes" (we already built this: store.subscribe(key, callback) from Part 4-A).
   * 2. getSnapshot — "React, please call this function to read the CURRENT value, any time you need it" (store.get(key)).
   */

  // ---- Wiring up useSyncExternalStore ----
  // "subscribe" tells React how to listen for changes to THIS key.
  // We wrap it in useCallback so React doesn't think this is a "new"
  // subscribe function on every single render (which would cause it to
  // needlessly unsubscribe and resubscribe constantly).
  const subscribe = useCallback(
    (onStoreChange: () => void) => store.subscribe(key, onStoreChange),
    [store, key],
  );
  // "getSnapshot" tells React how to READ the current value for this key.
  // store.get() returns the SAME object reference until something actually
  // changes (see Part 4-A) — this stability is required for useSyncExternalStore
  // to work correctly and avoid extra re-renders.
  const getSnapshot = useCallback(() => store.get<T>(key), [store, key]);

  // "entry" is either { data, timestamp } or undefined (nothing cached yet).
  // React automatically re-renders this component whenever "subscribe"
  // reports a change for this specific key — this is the magic that makes
  // our cache system feel "live" across completely unrelated components.
  const entry = useSyncExternalStore(subscribe, getSnapshot);

  // local state just for THIS hook instance's own fetch attempt
  const [error, setError] = useState<Error | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // We store the latest "fetcher" function in a ref instead of a plain
  // variable, so our effect below can always call the MOST RECENT version
  // of it, without needing to list it in the effect's dependency array
  // (fetcher is often a brand new arrow function every render, e.g.
  // "() => getProductById(id)" — listing it as a dependency would cause
  // the effect to re-run on every single render, which we don't want).
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  // Tracks whether this component is still mounted, so we don't try to
  // update state after it's gone (wasted work, and in older React versions
  // this used to cause a console warning). We deliberately do this in a
  // ref, updated only inside effects — NEVER during render itself, which
  // would be a React rule violation.
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // The actual function that performs a fetch, saves the result into the
  // shared cache, and updates our local loading/error state.
  const runFetch = useCallback(() => {
    setIsValidating(true);
    setError(null);

    dedupeRequest(key, () => fetcherRef.current())
      .then((data) => {
        // save the fresh data into the SHARED cache — this is what makes
        // every OTHER component watching this same key update too,
        // through the subscribe/notify system from Part 4-A
        store.set(key, data);
      })
      .catch((err: unknown) => {
        if (!isMountedRef.current) return; // component is gone — don't update its state
        setError(
          err instanceof Error ? err : new Error("Something went wrong"),
        );
      })
      .finally(() => {
        if (!isMountedRef.current) return;
        setIsValidating(false);
      });
  }, [key, store]);

  // 🚩 THE FIX: a stable boolean, true only when SOMETHING is currently
  // cached at this key. It flips false -> true the moment a fetch first
  // succeeds, and true -> false the moment ANYONE ELSE deletes this key
  // (invalidateExact, invalidateByPrefix, or our new store.clear() below).
  // Including it here means: if our data ever disappears out from under
  // us — for ANY reason, not just our own fetches — we notice and react.
  // It does NOT flip on ordinary updates (e.g. updateCacheEntry swapping
  // in a fresh quantity), since the entry still EXISTS either way — so
  // this fix doesn't cause any extra re-fetching beyond what's needed.
  const hasCachedEntry = entry !== undefined;

  // Decides WHETHER to fetch, and runs only when "key" or "enabled" changes
  // (deliberately NOT when "entry" or "staleTime" change — we only want to
  // make this staleness decision once per key/enabled combination, at the
  // moment a component asks for that key; we're not building a live
  // background timer here, just a "check on mount / key change" pattern).
  useEffect(() => {
    if (!enabled) return;

    const isStale = !entry || Date.now() - entry.timestamp > staleTime;

    if (isStale) {
      // We don't call runFetch() directly here. runFetch() calls
      // setState the INSTANT it runs (setIsValidating, setError), and
      // calling that synchronously, inside this effect's own execution,
      // is what triggers React's "cascading renders" warning.
      // queueMicrotask pushes the call to happen a tiny fraction
      // of a second later — after this effect finishes — so React treats
      // it the same safe way it treats any other async-triggered update,
      // like the .then() callback further down in runFetch already is.
      queueMicrotask(runFetch);
    }

    // "entry", "staleTime", and "runFetch" are intentionally left out of
    // this dependency list — see the comment above for why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled, hasCachedEntry]);

  // Exposed to components that want to force a fresh fetch on demand,
  // e.g. a "Refresh" button, or right after we know data changed elsewhere.
  const refetch = useCallback(() => {
    runFetch();
  }, [runFetch]);

  return {
    data: entry?.data,
    // "isLoading" is only true when we have NOTHING to show yet —
    // this is the "very first visit to this page" experience
    isLoading: isValidating && !entry,
    // "isValidating" is true for ANY fetch, including quiet background ones
    isValidating,
    error,
    refetch,
  };
}
