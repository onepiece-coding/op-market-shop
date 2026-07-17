/**
 * @file frontend/src/cache/dedupeRequest.ts
 */

// This Map lives at the MODULE level — meaning it's created exactly ONCE,
// the very first time this file is imported, and then SHARED by every
// single call to useFetch anywhere in the whole app. This is what lets
// two completely unrelated components (Header + Cart page) share ONE
// in-flight request for the same cache key.
const inFlightRequests = new Map<string, Promise<unknown>>();

/**
 * Prevents duplicate network requests for the same key happening at the
 * same time. If a request for "key" is already running, every other
 * caller just waits on that SAME promise instead of starting a new one.
 */
export function dedupeRequest<T>(
  key: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  // if someone is ALREADY fetching this exact key, hand back their promise
  const existing = inFlightRequests.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  // nobody is fetching this key right now — start a new request, and save
  // it in the map IMMEDIATELY (before any "await"), so any other call that
  // arrives in the next few milliseconds sees it here and reuses it
  const promise = fetcher().finally(() => {
    // once this request is fully done (success OR failure), remove it —
    // this guarantees the NEXT call to this key starts a truly fresh request,
    // rather than being stuck reusing a long-dead promise forever
    inFlightRequests.delete(key);
  });

  inFlightRequests.set(key, promise);
  return promise;
}
