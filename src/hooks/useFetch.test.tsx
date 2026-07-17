/**
 * @file frontend/src/hooks/useFetch.test.ts
 */

import { describe, it, expect, vi } from "vitest";
import { useState, type ReactNode } from "react";
import { CacheProvider } from "@/cache";
import { useFetch } from "./useFetch";

import {
  render,
  renderHook,
  waitFor,
  fireEvent,
  screen,
  act,
} from "@testing-library/react";

// every renderHook() call below uses this SAME wrapper, so each test
// gets its own fresh CacheProvider (and therefore a fresh, empty cache)
function wrapper({ children }: { children: ReactNode }) {
  return <CacheProvider>{children}</CacheProvider>;
}

describe("useFetch", () => {
  it("fetches data on mount when nothing is cached yet", async () => {
    const fetcher = vi.fn().mockResolvedValue({ id: 1, name: "Phone" });

    const { result } = renderHook(() => useFetch("test:mount", fetcher), {
      wrapper,
    });

    // right after mount, we have no data yet, so isLoading should already be true
    // expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();

    // wait for the fetch promise to resolve and the hook to update itself
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual({ id: 1, name: "Phone" });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
  });

  /* it("sets an error and stops loading when the fetcher throws", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("Network down"));

    const { result } = renderHook(() => useFetch("test:error", fetcher), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error?.message).toBe("Network down");
    expect(result.current.data).toBeUndefined();
  }); */

  it("does not fetch at all when enabled is false", async () => {
    const fetcher = vi.fn().mockResolvedValue({ id: 1 });

    renderHook(() => useFetch("test:disabled", fetcher, { enabled: false }), {
      wrapper,
    });

    // give any potential async work a moment to happen, so we can be sure
    // it genuinely never fires — not just "hasn't fired YET"
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(fetcher).not.toHaveBeenCalled();
  });

  it("refetch() manually triggers a new fetch, even while data is still fresh", async () => {
    const fetcher = vi.fn().mockResolvedValue({ id: 1 });
    const { result } = renderHook(
      () => useFetch("test:manual-refetch", fetcher),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetcher).toHaveBeenCalledTimes(1);

    // "act" tells React "a state update is about to happen on purpose,
    // please process it fully before I check anything else"
    act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
  });

  it("deduplicates two components mounting the SAME key at the same time", async () => {
    const fetcher = vi.fn().mockResolvedValue({ id: 1 });

    // this small component mounts TWO useFetch calls for the exact same
    // key, at the exact same time — simulating a Header + Cart page both
    // wanting the cart data the instant the app loads
    function TwoInstances() {
      const a = useFetch("test:shared", fetcher);
      const b = useFetch("test:shared", fetcher);
      return (
        <div>
          <span data-testid="a">
            {a.data ? JSON.stringify(a.data) : "none"}
          </span>
          <span data-testid="b">
            {b.data ? JSON.stringify(b.data) : "none"}
          </span>
        </div>
      );
    }

    render(
      <CacheProvider>
        <TwoInstances />
      </CacheProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("a").textContent).toContain("1");
      expect(screen.getByTestId("b").textContent).toContain("1");
    });

    // even though BOTH hooks wanted this key, only ONE real fetch happened
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("does not refetch on remount when the cached data is still fresh", async () => {
    const fetcher = vi.fn().mockResolvedValue({ id: 1 });

    // a small child component that calls useFetch — we'll mount and
    // unmount JUST this piece, while the CacheProvider around it stays alive
    function Child() {
      const { data, isLoading } = useFetch("test:fresh-remount", fetcher);
      return (
        <div data-testid="status">
          {isLoading ? "loading" : JSON.stringify(data)}
        </div>
      );
    }

    // this wrapper component lets our test toggle Child on and off,
    // while CacheProvider (and therefore the cache itself) never unmounts
    function Harness() {
      const [show, setShow] = useState(true);
      return (
        <div>
          <button onClick={() => setShow((current) => !current)}>toggle</button>
          {show && <Child />}
        </div>
      );
    }

    render(
      <CacheProvider>
        <Harness />
      </CacheProvider>,
    );

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));

    // hide the child (unmounts useFetch)...
    fireEvent.click(screen.getByText("toggle"));
    // ...then show it again (remounts useFetch, SAME underlying cache)
    fireEvent.click(screen.getByText("toggle"));

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).not.toBe("loading");
    });

    // the remount found FRESH cached data and skipped fetching entirely
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("refetches on remount once the cached data has become stale", async () => {
    const fetcher = vi.fn().mockResolvedValue({ id: 1 });

    function Child() {
      // a tiny 10ms staleTime, so we don't have to wait long in this test
      const { data, isLoading } = useFetch("test:stale-remount", fetcher, {
        staleTime: 10,
      });
      return (
        <div data-testid="status">
          {isLoading ? "loading" : JSON.stringify(data)}
        </div>
      );
    }

    function Harness() {
      const [show, setShow] = useState(true);
      return (
        <div>
          <button onClick={() => setShow((current) => !current)}>toggle</button>
          {show && <Child />}
        </div>
      );
    }

    render(
      <CacheProvider>
        <Harness />
      </CacheProvider>,
    );

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));

    // wait long enough for our 10ms staleTime to pass
    await new Promise((resolve) => setTimeout(resolve, 25));

    fireEvent.click(screen.getByText("toggle")); // unmount
    fireEvent.click(screen.getByText("toggle")); // remount

    // this time, the cached data is stale, so a SECOND real fetch should happen
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
  });
});
