/**
 * @file frontend/src/cache/CacheStore.ts
 */

// This describes ONE saved entry in our cache — the actual data, plus WHEN
// we saved it (we'll use "timestamp" in Part 5 to decide "is this too old,
// should I fetch a fresh copy?").
export interface CacheEntry<T> {
  data: T; // the actual saved data (a product list, a single order, etc.)
  timestamp: number; // the exact moment (in milliseconds) this was saved
}

// A "Listener" is just a plain function with no arguments and no return value.
// We call it whenever something changes, as a simple "hey, wake up!" signal —
// it's up to the LISTENER itself to go re-read the data it cares about after.
type Listener = () => void;

/**
 * CacheStore is a plain JavaScript class — NOT a React component, and it
 * does NOT use useState internally. This is intentional.
 *
 * It holds:
 * 1. A Map of cache KEY -> saved DATA (the actual cache)
 * 2. A Map of cache KEY -> a list of "listener" functions to call whenever
 *    that specific key's data changes (used by useFetch in Part 5)
 */
export class CacheStore {
  // "private" means only code INSIDE this class can touch these two Maps
  // directly — outside code must go through our methods below. This stops
  // anyone from accidentally editing the Map directly and skipping the
  // "notify the listeners" step, which would cause stale, out-of-sync UI.
  private entries: Map<string, CacheEntry<unknown>> = new Map();
  private listeners: Map<string, Set<Listener>> = new Map();

  // Reads one cache entry by its key. Returns "undefined" if nothing
  // has been cached under that key yet.
  // The "<T>" lets the CALLER say what type of data they expect back,
  // e.g. store.get<Product[]>("products:list") — so TypeScript knows
  // ".data" is a Product[], not just an unknown blob.
  get<T>(key: string): CacheEntry<T> | undefined {
    // "as CacheEntry<T>" tells TypeScript "trust me, this is the right shape" —
    // TypeScript can't verify this on its own since the Map itself stores "unknown"
    return this.entries.get(key) as CacheEntry<T> | undefined;
  }

  // Saves data under a key, and tells every listener watching that
  // EXACT key "hey, this key just changed — go re-check it".
  set<T>(key: string, data: T): void {
    // Date.now() gives the current time in milliseconds since 1970 —
    // a simple, sortable, comparable number we can use later for "freshness" checks
    this.entries.set(key, { data, timestamp: Date.now() });
    this.notify(key);
  }

  // Removes one entry entirely (this will power cache invalidation in Part 4-C,
  // e.g. removing a product from cache after it's deleted on the server).
  delete(key: string): void {
    this.entries.delete(key);
    this.notify(key);
  }

  // Checks if a key currently has anything cached, without reading it.
  has(key: string): boolean {
    return this.entries.has(key);
  }

  // Lets a component "subscribe" to one specific key — meaning
  // "call this function whenever that key's data changes".
  // Returns an "unsubscribe" function, which the component must call when
  // it disappears from the screen, so we stop calling a function that no
  // longer has anywhere to update — this avoids a bug called a "memory leak"
  // (old, invisible components secretly still running code forever).
  subscribe(key: string, listener: Listener): () => void {
    // if nobody is listening to this key yet, create a fresh empty Set for it.
    // A "Set" is like an array, but automatically prevents duplicate entries.
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    // "!" (non-null assertion) tells TypeScript "trust me, we just guaranteed
    // this exists on the line right above"
    this.listeners.get(key)!.add(listener);

    // this returned function IS the "unsubscribe" action — calling it removes
    // just THIS ONE listener from the set, leaving any other listeners on the
    // same key completely untouched
    return () => {
      this.listeners.get(key)?.delete(listener);
    };
  }

  // Calls every listener currently subscribed to one key. Marked "private"
  // because only THIS class's own methods (set, delete) should ever be
  // allowed to trigger a notification — outside code should never be able
  // to fake a "change" that didn't really happen.
  private notify(key: string): void {
    const keyListeners = this.listeners.get(key);
    if (!keyListeners) return; // nobody is listening to this key — nothing to do
    // call each subscribed function, one after another
    keyListeners.forEach((listener) => listener());
  }

  // Returns every key currently stored in the cache, as a plain array of strings.
  // Used by our prefix-invalidation strategy below, to find which keys match.
  keys(): string[] {
    // Array.from() converts the Map's internal "keys iterator" into a real array
    // we can use normal array methods on (like .filter(), which we need next)
    return Array.from(this.entries.keys());
  }

  // Removes EVERY cached entry at once, notifying each key's listeners.
  // Used when a user logs out (or their session silently expires), so no
  // stale, potentially user-specific data — cart, orders, addresses —
  // lingers around and leaks into whatever the NEXT visitor on this
  // browser sees. We reuse delete() per key so existing listeners still
  // get notified correctly, one key at a time.
  clear(): void {
    // grab the keys FIRST — deleting while iterating a live Map can skip entries
    const allKeys = this.keys();
    allKeys.forEach((key) => this.delete(key));
  }
}
