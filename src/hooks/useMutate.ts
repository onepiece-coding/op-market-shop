/**
 * @file frontend/src/hooks/useMutate.ts
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useCacheStore } from "./useCacheStore";
import type { CacheStore } from "@/cache";

export interface UseMutateOptions<TData, TVariables> {
  // called ONLY after a successful mutation. We hand you the fresh "data"
  // the server returned, the "variables" you originally passed to mutate(),
  // AND the real CacheStore instance — so you can call invalidateExact,
  // invalidateByPrefix, or updateCacheEntry right here, using whichever
  // strategy fits THIS specific mutation (see Part 4-C's table).
  onSuccess?: (data: TData, variables: TVariables, store: CacheStore) => void;
  // called ONLY when the mutation fails — useful for things like showing
  // a Toast notification (which we'll build in Part 7-B).
  onError?: (error: Error, variables: TVariables) => void;
}

export interface UseMutateResult<TData, TVariables> {
  // call this to actually RUN the mutation, e.g. mutate({ productId: 3, quantity: 1 })
  mutate: (variables: TVariables) => Promise<TData>;
  isLoading: boolean; // true while the mutation is in flight
  error: Error | null; // the most recent error, if the last attempt failed
  data: TData | undefined; // the most recent successful result, if any
  reset: () => void; // clears "error" and "data" back to their starting state
}

/**
 * useMutate wraps any "write" API function (POST/PUT/DELETE) — like
 * addToCart, updateProduct, cancelOrder — with loading/error tracking,
 * and gives you a hook into the shared cache on success.
 *
 * "TVariables = void" means: if a mutation needs no input at all
 * (like logout()), you can call useMutate<MessageResponse>(logout) without
 * ever having to specify a variables type.
 */
export function useMutate<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseMutateOptions<TData, TVariables> = {},
): UseMutateResult<TData, TVariables> {
  const store = useCacheStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TData | undefined>(undefined);

  // We store BOTH the mutation function and the options object in refs.
  // WHY: components very often pass a brand-new arrow function as
  // "mutationFn" and a brand-new object as "options" on EVERY render
  // (e.g. "useMutate((v) => addToCart(v), { onSuccess: ... })" creates
  // new function/object instances each time the component re-renders).
  // If we depended on these directly, our "mutate" function's identity
  // would change every render too — which would be annoying for any
  // component that, say, passes "mutate" down to a child button as a prop.
  // Refs let us always call the LATEST version, while keeping "mutate"
  // itself referentially stable across renders.
  const mutationFnRef = useRef(mutationFn);
  const optionsRef = useRef(options);

  useEffect(() => {
    mutationFnRef.current = mutationFn;
    optionsRef.current = options;
  }, [mutationFn, options]);

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setIsLoading(true);
      setError(null);

      try {
        // run the actual API call (e.g. the real addToCart from Part 3-C-3)
        const result = await mutationFnRef.current(variables);

        setData(result);
        // hand the caller everything they need to update the cache correctly —
        // we don't decide HOW here, that's the caller's job (see examples below)
        optionsRef.current.onSuccess?.(result, variables, store);

        return result;
      } catch (err) {
        const normalizedError =
          err instanceof Error ? err : new Error("Something went wrong");

        setError(normalizedError);
        optionsRef.current.onError?.(normalizedError, variables);

        // re-throw so the CALLER can also catch this in their own code if
        // they need to (e.g. "keep this modal open if the mutation failed")
        throw normalizedError;
      } finally {
        setIsLoading(false);
      }
    },
    // "store" never actually changes during the app's lifetime (Part 4-A
    // guarantees ONE instance via useState's lazy initializer), so in
    // practice "mutate" is stable for the whole component's life.
    [store],
  );

  const reset = useCallback(() => {
    setError(null);
    setData(undefined);
  }, []);

  return { mutate, isLoading, error, data, reset };
}
