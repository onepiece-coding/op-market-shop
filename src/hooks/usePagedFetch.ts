/**
 * @file frontend/src/hooks/usePagedFetch.ts
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { PaginatedResponse } from "@/types/api";
import type { UseFetchOptions } from "./useFetch";
import { useFetch } from "./useFetch";

export interface UsePagedFetchOptions extends UseFetchOptions {
  // which page to start on — almost always 1, but exposed just in case
  // (e.g. restoring a page number from the URL later)
  initialPage?: number;
  // ANY value here — a search term, a filter, a category id, etc.
  // Whenever THIS value changes compared to its previous value, we
  // automatically reset "page" back to 1. This is exactly the fix for
  // the "stale page number" bug.
  resetKey?: string | number;
}

export interface UsePagedFetchResult<T> {
  data: T[]; // the current page's items (never undefined — defaults to an empty array)
  // the raw pagination metadata from the server, or undefined before the first load
  pagination: PaginatedResponse<T>["pagination"] | undefined;
  page: number; // the page number we're currently viewing
  setPage: (page: number) => void; // jump directly to a specific page
  nextPage: () => void; // go forward one page
  prevPage: () => void; // go back one page
  hasNextPage: boolean; // true if a page AFTER this one exists
  hasPrevPage: boolean; // true if we're not already on page 1
  isLoading: boolean; // true only on this page's very first load
  isValidating: boolean; // true any time a fetch for this page is happening
  error: Error | null;
  refetch: () => void; // force-refresh the CURRENT page
}

/**
 * usePagedFetch manages a "current page number" and, on every page change,
 * asks useFetch for that page's data under its OWN unique cache key. Every
 * page you've visited stays cached separately — clicking "back" to a page
 * you've already seen is instant, no network call needed (as long as it's
 * still fresh — same staleTime rules as Part 5-A).
 *
 * "buildKey" and "fetchPage" are both functions of ONE argument (the page
 * number) that YOU provide — this keeps usePagedFetch fully generic. It has
 * no idea what "products" or "orders" even are; it just orchestrates paging.
 */
export function usePagedFetch<T>(
  buildKey: (page: number) => string,
  fetchPage: (page: number) => Promise<PaginatedResponse<T>>,
  options: UsePagedFetchOptions = {},
): UsePagedFetchResult<T> {
  // pull our two paging-specific options out, and pass the REST straight
  // through to useFetch untouched (staleTime, enabled, etc.)
  const { initialPage = 1, resetKey, ...fetchOptions } = options;

  const [page, setPageState] = useState(initialPage);

  // ---- THE "RESET TO PAGE 1" FIX ----
  // We keep track of the PREVIOUS resetKey value in a ref. Refs don't
  // trigger re-renders when changed, and they persist across renders —
  // perfect for "remember what this was last time, so I can compare."
  const previousResetKeyRef = useRef(resetKey);

  useEffect(() => {
    // only reset if resetKey ACTUALLY changed since last time (not on
    // the very first render, where "previous" and "current" are the same
    // value by definition — this avoids pointlessly resetting on mount)
    if (previousResetKeyRef.current !== resetKey) {
      previousResetKeyRef.current = resetKey;
      setPageState(1);
    }
  }, [resetKey]);

  // Build THIS page's specific key and fetcher fresh on every render.
  // This is cheap (just a function call), always accurate, and — as
  // explained above — safe to leave un-memoized because useFetch handles
  // fetcher-identity-changes internally via its own ref pattern (Part 5-A).
  const key = buildKey(page);
  const fetcher = () => fetchPage(page);

  const {
    data: pageResult, // the FULL PaginatedResponse<T> for this page, or undefined
    isLoading,
    isValidating,
    error,
    refetch,
  } = useFetch<PaginatedResponse<T>>(key, fetcher, fetchOptions);

  // ---- Page navigation helpers ----

  const setPage = useCallback((newPage: number) => {
    // Math.max(1, ...) guards against ever navigating to page 0 or negative —
    // an easy mistake if a component passes something like "page - 1" blindly
    setPageState(Math.max(1, newPage));
  }, []);

  const nextPage = useCallback(() => {
    setPageState((current) => current + 1);
  }, []);

  const prevPage = useCallback(() => {
    setPageState((current) => Math.max(1, current - 1));
  }, []);

  // ---- Derived "can I go forward/backward" flags ----
  // These exist so a component can simply write
  // <button disabled={!hasNextPage}>Next</button> without doing this math itself.

  const hasPrevPage = page > 1;
  // if we don't have pagination info yet (still loading the very first
  // time), we conservatively say "no next page" rather than guessing
  const hasNextPage = pageResult
    ? page < pageResult.pagination.totalPages
    : false;

  return {
    // "?? []" ensures components never have to handle "data is undefined" —
    // before the first successful load, they just see an empty list, which
    // is easy to render (e.g. straight into an empty <ul>) without extra checks
    data: pageResult?.data ?? [],
    pagination: pageResult?.pagination,
    page,
    setPage,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,
    isLoading,
    isValidating,
    error,
    refetch,
  };
}
