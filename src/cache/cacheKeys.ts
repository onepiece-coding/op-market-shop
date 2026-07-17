/**
 * @file frontend/src/cache/cacheKeys.ts
 */

import type { ProductQueryParams, ProductSearchParams } from "@/types/product";
import type { OrderQueryParams } from "@/types/order";
import type { UserQueryParams } from "@/types/user";
import type { ID } from "@/types/common";

// the shape of "extra params" any cache key builder might accept
type CacheKeyParams = unknown;

/**
 * Turns a base resource name + a params object into ONE deterministic string.
 * "Deterministic" means: the SAME params always produce the SAME string,
 * no matter what ORDER the object's fields were written in.
 */
export function buildCacheKey(
  resource: string,
  params?: CacheKeyParams,
): string {
  // if there are no params at all, the key is just the resource name itself
  if (!params) return resource;

  const entries = Object.entries(params)
    // remove any "empty" values — same rule as our buildQueryString helper,
    // so { page: 1, q: undefined } and { page: 1 } produce the SAME key
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    )
    // THIS is the important line: sort alphabetically by key name.
    // localeCompare is the correct, safe way to compare two strings in JS.
    // This guarantees { page: 1, limit: 10 } and { limit: 10, page: 1 }
    // both end up in the SAME order: "limit" before "page".
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

  // after filtering, there might be nothing left — just return the plain resource name
  if (entries.length === 0) return resource;

  // rebuild a simple "key=value&key=value" string from our now-sorted entries
  const paramsString = entries
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return `${resource}?${paramsString}`;
}

/**
 * This object is the ONE AND ONLY place cache key strings are ever written
 * by hand in our whole app. Every hook and component in Part 5+ will call
 * these functions instead of typing key strings themselves — this makes a
 * typo like "product:list" vs "products:list" IMPOSSIBLE, because there's
 * only ever one function that can produce that string.
 *
 * "as const" at the bottom locks this object down — TypeScript will treat
 * every function inside as fixed and read-only, giving us better autocomplete
 * and catching any accidental attempt to reassign "cacheKeys.products" elsewhere.
 */
export const cacheKeys = {
  products: {
    // used by our PUBLIC shop page (Part 3-C-2's searchProducts)
    search: (params: ProductSearchParams = {}) =>
      buildCacheKey("products:search", params),
    // used ONLY by the admin panel (Part 3-C-2's listProducts)
    list: (params: ProductQueryParams = {}) =>
      buildCacheKey("products:list", params),
    // a single product's own key — no params to sort, so just a plain template string
    detail: (id: ID) => `products:detail:${id}`,
  },

  cart: {
    // the cart has no pagination or search — it's always just ONE list per user
    all: () => "cart:all",
  },

  orders: {
    // the logged-in user's OWN orders (Part 3-C-4's listMyOrders)
    mine: () => "orders:mine",
    // one specific order, works for both a normal user and an admin
    detail: (id: ID) => `orders:detail:${id}`,
    // admin-only: every order across every user
    adminAll: (params: OrderQueryParams = {}) =>
      buildCacheKey("orders:admin:all", params),
    // admin-only: every order belonging to ONE specific user
    byUser: (userId: ID, params: OrderQueryParams = {}) =>
      buildCacheKey(`orders:admin:byUser:${userId}`, params),
  },

  users: {
    // the logged-in user's own profile (used by our future AuthContext, Part 6)
    me: () => "auth:me",
    // the logged-in user's own saved addresses
    addresses: () => "users:addresses",
    // admin-only: every user, paginated
    list: (params: UserQueryParams = {}) => buildCacheKey("users:list", params),
    // admin-only: one specific user (with their addresses attached)
    detail: (id: ID) => `users:detail:${id}`,
  },
} as const;
