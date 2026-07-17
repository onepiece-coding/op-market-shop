/**
 * @file frontend/src/hooks/usePagedFetch.test.ts
 */

import { renderHook, waitFor, act } from "@testing-library/react";
import type { PaginatedResponse } from "@/types/api";
import { describe, it, expect, vi } from "vitest";
import { usePagedFetch } from "./usePagedFetch";
import { CacheProvider } from "@/cache";
import type { ReactNode } from "react";

function wrapper({ children }: { children: ReactNode }) {
  return <CacheProvider>{children}</CacheProvider>;
}

// builds a fake paginated response for a given page — each page's "data"
// clearly identifies WHICH page it came from, so our tests can tell them apart
function makePage(
  page: number,
  totalPages = 3,
): PaginatedResponse<{ id: number }> {
  return {
    data: [{ id: page }],
    pagination: {
      current: page,
      limit: 10,
      totalPages,
      results: totalPages * 10,
    },
  };
}

describe("usePagedFetch", () => {
  it("fetches page 1 by default, and reports correct hasNext/hasPrev flags", async () => {
    const fetchPage = vi.fn((page: number) => Promise.resolve(makePage(page)));
    const buildKey = (page: number) => `test:products:page:${page}`;

    const { result } = renderHook(() => usePagedFetch(buildKey, fetchPage), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.page).toBe(1);
    expect(result.current.data).toEqual([{ id: 1 }]);
    expect(result.current.pagination?.totalPages).toBe(3);
    // page 1 of 3: no previous page, but there IS a next page
    expect(result.current.hasPrevPage).toBe(false);
    expect(result.current.hasNextPage).toBe(true);
    expect(fetchPage).toHaveBeenCalledWith(1);
  });

  it("setPage jumps directly to the requested page and fetches its data", async () => {
    const fetchPage = vi.fn((page: number) => Promise.resolve(makePage(page)));
    const buildKey = (page: number) => `test:setpage:page:${page}`;

    const { result } = renderHook(() => usePagedFetch(buildKey, fetchPage), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.setPage(2);
    });

    await waitFor(() => expect(result.current.page).toBe(2));
    await waitFor(() => expect(result.current.data).toEqual([{ id: 2 }]));
    expect(fetchPage).toHaveBeenCalledWith(2);
  });

  it("nextPage() and prevPage() move one page at a time", async () => {
    const fetchPage = vi.fn((page: number) => Promise.resolve(makePage(page)));
    const buildKey = (page: number) => `test:nextprev:page:${page}`;

    const { result } = renderHook(() => usePagedFetch(buildKey, fetchPage), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.nextPage());
    await waitFor(() => expect(result.current.page).toBe(2));

    act(() => result.current.nextPage());
    await waitFor(() => expect(result.current.page).toBe(3));

    act(() => result.current.prevPage());
    await waitFor(() => expect(result.current.page).toBe(2));
  });

  it("prevPage() never goes below page 1", async () => {
    const fetchPage = vi.fn((page: number) => Promise.resolve(makePage(page)));
    const buildKey = (page: number) => `test:clamp:page:${page}`;

    const { result } = renderHook(() => usePagedFetch(buildKey, fetchPage), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // we're already on page 1 — calling prevPage() should have NO effect
    act(() => result.current.prevPage());

    // give it a moment, then confirm page truly stayed at 1
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(result.current.page).toBe(1);
  });

  it("hasNextPage becomes false once we reach the LAST page", async () => {
    // only 2 total pages this time
    const fetchPage = vi.fn((page: number) =>
      Promise.resolve(makePage(page, 2)),
    );
    const buildKey = (page: number) => `test:lastpage:page:${page}`;

    const { result } = renderHook(() => usePagedFetch(buildKey, fetchPage), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.nextPage());
    await waitFor(() => expect(result.current.page).toBe(2));

    // now on page 2 of 2 — this really IS the last page
    expect(result.current.hasNextPage).toBe(false);
    expect(result.current.hasPrevPage).toBe(true);
  });

  it("changing resetKey snaps the page back to 1 (the classic pagination bug fix)", async () => {
    const fetchPage = vi.fn((page: number) => Promise.resolve(makePage(page)));
    const buildKey = (page: number) => `test:resetkey:page:${page}`;

    const { result, rerender } = renderHook(
      ({ resetKey }: { resetKey: string }) =>
        usePagedFetch(buildKey, fetchPage, { resetKey }),
      { wrapper, initialProps: { resetKey: "iphone" } },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // simulate the user paging forward while searching "iphone"
    act(() => result.current.setPage(3));
    await waitFor(() => expect(result.current.page).toBe(3));

    // now simulate the user changing their search term to "laptop" —
    // a real component would pass THIS new value as resetKey
    rerender({ resetKey: "laptop" });

    // the page should automatically snap back to 1, preventing the
    // "empty page 3 of laptop results" bug described above
    await waitFor(() => expect(result.current.page).toBe(1));
  });

  it("does NOT reset the page when resetKey stays the same across re-renders", async () => {
    const fetchPage = vi.fn((page: number) => Promise.resolve(makePage(page)));
    const buildKey = (page: number) => `test:noresetneeded:page:${page}`;

    const { result, rerender } = renderHook(
      ({ resetKey }: { resetKey: string }) =>
        usePagedFetch(buildKey, fetchPage, { resetKey }),
      { wrapper, initialProps: { resetKey: "iphone" } },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setPage(2));
    await waitFor(() => expect(result.current.page).toBe(2));

    // re-render with the EXACT SAME resetKey — page 2 should be left alone
    rerender({ resetKey: "iphone" });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(result.current.page).toBe(2);
  });

  it("revisiting an already-cached page does not trigger a duplicate fetch", async () => {
    const fetchPage = vi.fn((page: number) => Promise.resolve(makePage(page)));
    const buildKey = (page: number) => `test:revisit:page:${page}`;

    const { result } = renderHook(() => usePagedFetch(buildKey, fetchPage), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetchPage).toHaveBeenCalledTimes(1); // page 1 fetched

    act(() => result.current.setPage(2));
    await waitFor(() => expect(result.current.page).toBe(2));
    expect(fetchPage).toHaveBeenCalledTimes(2); // page 2 fetched

    // go back to page 1 — still fresh (well within the default 30s staleTime)
    act(() => result.current.setPage(1));
    await waitFor(() => expect(result.current.page).toBe(1));

    // give any potential (unwanted) fetch a moment to happen, then confirm
    // the call count did NOT climb to 3 — page 1's cached data was reused
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(result.current.data).toEqual([{ id: 1 }]);
  });
});
