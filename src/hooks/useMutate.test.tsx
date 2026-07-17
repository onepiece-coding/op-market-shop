/**
 * @file frontend/src/hooks/useMutate.test.ts
 */

import { renderHook, act } from "@testing-library/react";
import { CacheStore, CacheProvider } from "@/cache";
import { describe, it, expect, vi } from "vitest";
import { useMutate } from "./useMutate";
import type { ReactNode } from "react";

function wrapper({ children }: { children: ReactNode }) {
  return <CacheProvider>{children}</CacheProvider>;
}

describe("useMutate", () => {
  it("starts with no data, no error, and isLoading false", () => {
    const mutationFn = vi.fn().mockResolvedValue({ id: 1 });
    const { result } = renderHook(() => useMutate(mutationFn), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });

  it("sets isLoading true while running, then false and data set on success", async () => {
    const mutationFn = vi
      .fn()
      .mockResolvedValue({ id: 1, name: "New Product" });
    const { result } = renderHook(() => useMutate(mutationFn), { wrapper });

    // we don't await this yet — we want to check isLoading WHILE it's running
    let mutatePromise: Promise<unknown>;
    act(() => {
      mutatePromise = result.current.mutate({ name: "New Product" });
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      await mutatePromise;
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual({ id: 1, name: "New Product" });
    expect(result.current.error).toBeNull();
  });

  it("sets error and rethrows when the mutation function fails", async () => {
    const mutationFn = vi
      .fn()
      .mockRejectedValue(new Error("Product not found!"));
    const { result } = renderHook(() => useMutate(mutationFn), { wrapper });

    // the promise returned by mutate() should ALSO reject — this proves
    // the caller can still use their own try/catch around it if they want to
    await act(async () => {
      await expect(result.current.mutate({ id: 999 })).rejects.toThrow(
        "Product not found!",
      );
    });

    expect(result.current.error?.message).toBe("Product not found!");
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it("calls onSuccess with the data, the original variables, and a real CacheStore", async () => {
    const mutationFn = vi.fn().mockResolvedValue({ id: 5 });
    const onSuccess = vi.fn();

    const { result } = renderHook(() => useMutate(mutationFn, { onSuccess }), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutate({ productId: 3, quantity: 2 });
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
    const [dataArg, variablesArg, storeArg] = onSuccess.mock.calls[0];
    expect(dataArg).toEqual({ id: 5 });
    expect(variablesArg).toEqual({ productId: 3, quantity: 2 });
    // confirm we really did receive the REAL cache store, not a fake stand-in —
    // this matters because callers need to call real invalidation functions on it
    expect(storeArg).toBeInstanceOf(CacheStore);
  });

  it("calls onError with the normalized error and the original variables", async () => {
    const mutationFn = vi.fn().mockRejectedValue(new Error("Cart is empty"));
    const onError = vi.fn();

    const { result } = renderHook(() => useMutate(mutationFn, { onError }), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutate({ paymentMethod: "PAYPAL" }).catch(() => {
        // swallow it here on purpose — we already assert on onError below,
        // this catch just stops the test itself from failing on the rethrow
      });
    });

    expect(onError).toHaveBeenCalledTimes(1);
    const [errorArg, variablesArg] = onError.mock.calls[0];
    expect(errorArg.message).toBe("Cart is empty");
    expect(variablesArg).toEqual({ paymentMethod: "PAYPAL" });
  });

  it("does NOT call onSuccess when the mutation fails", async () => {
    const mutationFn = vi.fn().mockRejectedValue(new Error("fail"));
    const onSuccess = vi.fn();

    const { result } = renderHook(() => useMutate(mutationFn, { onSuccess }), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutate(undefined).catch(() => {});
    });

    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("reset() clears both error and data back to their starting values", async () => {
    const mutationFn = vi.fn().mockResolvedValue({ id: 1 });
    const { result } = renderHook(() => useMutate(mutationFn), { wrapper });

    await act(async () => {
      await result.current.mutate(undefined);
    });
    expect(result.current.data).toEqual({ id: 1 });

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });
});
