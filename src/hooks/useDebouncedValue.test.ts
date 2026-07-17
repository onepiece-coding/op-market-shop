/**
 * @file frontend/src/hooks/useDebouncedValue.test.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebouncedValue } from "./useDebouncedValue";

describe("useDebouncedValue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the initial value immediately, before any delay passes", () => {
    const { result } = renderHook(() => useDebouncedValue("hello", 400));
    expect(result.current).toBe("hello");
  });

  it("does NOT update until the delay has fully passed", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 400),
      {
        initialProps: { value: "a" },
      },
    );

    rerender({ value: "ab" });

    // still "a" — only 0ms of the 400ms delay has passed so far
    expect(result.current).toBe("a");
  });

  it("updates to the new value once the delay fully passes", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 400),
      {
        initialProps: { value: "a" },
      },
    );

    rerender({ value: "ab" });

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(result.current).toBe("ab");
  });

  it("THE CORE BEHAVIOR: rapid changes collapse into just the LAST value", () => {
    // this simulates fast typing: "i", "ip", "iph", "ipho", "iphon", "iphone"
    // — six changes in quick succession, each one arriving BEFORE the
    // previous 400ms timer had a chance to finish
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 400),
      {
        initialProps: { value: "i" },
      },
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ value: "ip" });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ value: "iph" });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ value: "iphone" });

    // still nothing settled yet — the last change reset the clock to 0
    expect(result.current).toBe("i");

    act(() => {
      vi.advanceTimersByTime(400);
    });

    // the debounced value jumps DIRECTLY to the final typed value —
    // it never passed through "ip" or "iph" as separate debounced outputs
    expect(result.current).toBe("iphone");
  });
});
