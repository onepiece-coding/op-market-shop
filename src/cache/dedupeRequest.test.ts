/**
 * @file frontend/src/cache/dedupeRequest.test.ts
 */

import { describe, it, expect, vi } from "vitest";
import { dedupeRequest } from "./dedupeRequest";

describe("dedupeRequest", () => {
  it("only calls the fetcher ONCE when the same key is requested twice before it resolves", async () => {
    const fetcherA = vi.fn().mockResolvedValue("result-A");
    const fetcherB = vi.fn().mockResolvedValue("result-B");

    // fire BOTH at the same time — this is the exact race condition we're guarding against
    const [resultA, resultB] = await Promise.all([
      dedupeRequest("shared-key", fetcherA),
      dedupeRequest("shared-key", fetcherB),
    ]);

    // fetcherA "won" because it was registered first — fetcherB's function
    // body never even ran, and BOTH callers received fetcherA's result
    expect(fetcherA).toHaveBeenCalledTimes(1);
    expect(fetcherB).not.toHaveBeenCalled();
    expect(resultA).toBe("result-A");
    expect(resultB).toBe("result-A");
  });

  it("calls the fetcher again on a brand NEW request, after the previous one finished", async () => {
    const fetcher = vi.fn().mockResolvedValue("first");
    await dedupeRequest("key", fetcher);

    fetcher.mockResolvedValue("second");
    const result = await dedupeRequest("key", fetcher);

    // this proves we're not accidentally caching forever — only DURING flight
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(result).toBe("second");
  });

  it("runs requests for DIFFERENT keys completely independently", async () => {
    const fetcherA = vi.fn().mockResolvedValue("A");
    const fetcherB = vi.fn().mockResolvedValue("B");

    const [resultA, resultB] = await Promise.all([
      dedupeRequest("key-a", fetcherA),
      dedupeRequest("key-b", fetcherB),
    ]);

    expect(fetcherA).toHaveBeenCalledTimes(1);
    expect(fetcherB).toHaveBeenCalledTimes(1);
    expect(resultA).toBe("A");
    expect(resultB).toBe("B");
  });

  it("removes the in-flight entry even when the fetcher fails, so a retry is possible", async () => {
    const failingFetcher = vi.fn().mockRejectedValue(new Error("boom"));

    await expect(dedupeRequest("failing-key", failingFetcher)).rejects.toThrow(
      "boom",
    );

    // a second call to the SAME key should try again fresh, not reuse a dead promise
    const workingFetcher = vi.fn().mockResolvedValue("recovered");
    const result = await dedupeRequest("failing-key", workingFetcher);

    expect(workingFetcher).toHaveBeenCalledTimes(1);
    expect(result).toBe("recovered");
  });
});
