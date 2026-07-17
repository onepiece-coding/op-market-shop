/**
 * @file frontend/api/apiRequest.test.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { setAuthExpiredHandler } from "./authExpiredHandler";
import { apiRequest } from "./apiRequest";
import { ApiError } from "./ApiError";

// same small helper as our apiFetch tests — builds a fake Response object
function createFakeResponse(options: {
  ok: boolean;
  status: number;
  body: unknown;
}) {
  return {
    ok: options.ok,
    status: options.status,
    text: async () => JSON.stringify(options.body),
  };
}

describe("apiRequest", () => {
  // a fake function we can check later: "was this called? how many times?"
  const authExpiredSpy = vi.fn();

  beforeEach(() => {
    // fresh fake fetch before every test, so tests never affect each other
    vi.stubGlobal("fetch", vi.fn());
    // reset our spy's call history before every test
    authExpiredSpy.mockClear();
    // register our spy as the "what happens when session dies" handler
    setAuthExpiredHandler(authExpiredSpy);
  });

  it("returns data directly when the first request already succeeds", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      createFakeResponse({ ok: true, status: 200, body: { message: "ok" } }),
    );

    const result = await apiRequest<{ message: string }>("/cart");

    expect(result).toEqual({ message: "ok" });
    // fetch should have been called EXACTLY once — no refresh was needed
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("on a 401, refreshes the token then retries the original request once", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;

    fetchMock
      // 1st call: the original request to /cart fails with 401 (expired token)
      .mockResolvedValueOnce(
        createFakeResponse({
          ok: false,
          status: 401,
          body: { message: "Unauthorized!" },
        }),
      )
      // 2nd call: our internal refresh call to /auth/refresh succeeds
      .mockResolvedValueOnce(
        createFakeResponse({
          ok: true,
          status: 200,
          body: { user: { id: 1 } },
        }),
      )
      // 3rd call: the RETRY of the original /cart request now succeeds
      .mockResolvedValueOnce(
        createFakeResponse({
          ok: true,
          status: 200,
          body: [{ id: 1, quantity: 2 }],
        }),
      );

    const result =
      await apiRequest<Array<{ id: number; quantity: number }>>("/cart");

    // we should end up with the data from the SUCCESSFUL retry (3rd call)
    expect(result).toEqual([{ id: 1, quantity: 2 }]);
    // fetch was called 3 times total: original (fail) + refresh + retry (success)
    expect(fetch).toHaveBeenCalledTimes(3);

    // let's also confirm call #2 really was the refresh endpoint
    const secondCallUrl = fetchMock.mock.calls[1][0] as string;
    expect(secondCallUrl).toContain("/auth/refresh");

    // the session was NOT truly dead here, so our handler should NOT have fired
    expect(authExpiredSpy).not.toHaveBeenCalled();
  });

  it("when refresh also fails, throws the ORIGINAL error and calls the auth-expired handler", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;

    fetchMock
      // 1st call: original request fails with 401
      .mockResolvedValueOnce(
        createFakeResponse({
          ok: false,
          status: 401,
          body: { message: "Unauthorized!" },
        }),
      )
      // 2nd call: the refresh attempt ALSO fails (refresh token expired too)
      .mockResolvedValueOnce(
        createFakeResponse({
          ok: false,
          status: 401,
          body: { message: "Invalid refresh token" },
        }),
      );

    // we expect this whole call to eventually throw — so we wrap it in try/catch
    try {
      await apiRequest("/cart");
      // if we reach this line, apiRequest did NOT throw — that's wrong, fail on purpose
      expect.fail("apiRequest should have thrown, but it did not");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      // IMPORTANT: the error the CALLER sees should be the ORIGINAL /cart error,
      // not some generic "refresh failed" error — this makes debugging much easier
      expect((error as ApiError).message).toBe("Unauthorized!");
    }

    // only 2 calls total: original + one failed refresh attempt (no pointless retry)
    expect(fetch).toHaveBeenCalledTimes(2);
    // the session really IS dead now, so our handler SHOULD have fired exactly once
    expect(authExpiredSpy).toHaveBeenCalledTimes(1);
  });

  it("deduplicates concurrent 401s into a single refresh call", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;

    // We simulate: TWO different requests (cart + orders) both get a 401
    // at nearly the same time, then ONE shared refresh succeeds, then
    // BOTH original requests are retried and succeed.
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/auth/refresh")) {
        return Promise.resolve(
          createFakeResponse({
            ok: true,
            status: 200,
            body: { user: { id: 1 } },
          }),
        );
      }
      if (url.includes("/cart")) {
        // first time /cart is called it's a 401; we track that with a counter
        return Promise.resolve(
          cartCallCount++ === 0
            ? createFakeResponse({
                ok: false,
                status: 401,
                body: { message: "Unauthorized!" },
              })
            : createFakeResponse({
                ok: true,
                status: 200,
                body: { from: "cart" },
              }),
        );
      }
      if (url.includes("/orders")) {
        return Promise.resolve(
          ordersCallCount++ === 0
            ? createFakeResponse({
                ok: false,
                status: 401,
                body: { message: "Unauthorized!" },
              })
            : createFakeResponse({
                ok: true,
                status: 200,
                body: { from: "orders" },
              }),
        );
      }
      throw new Error(`Unexpected URL in test: ${url}`);
    });

    // these two counters track how many times each endpoint has been hit,
    // so our fake fetch above knows whether to fail (first time) or succeed (after)
    let cartCallCount = 0;
    let ordersCallCount = 0;

    // fire BOTH requests at the same time (this is the whole point of the test) —
    // Promise.all runs them concurrently, just like two components fetching at once
    const [cartResult, ordersResult] = await Promise.all([
      apiRequest<{ from: string }>("/cart"),
      apiRequest<{ from: string }>("/orders"),
    ]);

    expect(cartResult).toEqual({ from: "cart" });
    expect(ordersResult).toEqual({ from: "orders" });

    // count exactly how many of ALL the fetch calls were to /auth/refresh
    const refreshCalls = fetchMock.mock.calls.filter((call) =>
      (call[0] as string).includes("/auth/refresh"),
    );
    // even though BOTH requests hit a 401, refresh should only have happened ONCE
    expect(refreshCalls.length).toBe(1);
  });

  it("does not attempt to refresh when the /auth/refresh call itself returns 401", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      createFakeResponse({
        ok: false,
        status: 401,
        body: { message: "No refresh token" },
      }),
    );

    try {
      await apiRequest("/auth/refresh", { method: "POST" });
      expect.fail("apiRequest should have thrown, but it did not");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
    }

    // only ONE fetch call ever happened — proof there was no infinite retry loop
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
