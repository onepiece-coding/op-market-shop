/**
 * @file frontend/api/apiFetch.test.ts
 */

// "describe" groups related tests together under one label, like a folder for tests
// "it" defines ONE single test case, with a plain-English description of what it checks
// "expect" is how we make an assertion (a claim we're checking is true)
// "vi" is Vitest's built-in tool for creating mocks (fake functions)
import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiFetch } from "./apiFetch";
import { ApiError } from "./ApiError";

// this helper builds a FAKE version of what fetch() normally returns,
// so we don't have to repeat this fake object in every single test below
function createFakeResponse(options: {
  ok: boolean;
  status: number;
  body: unknown;
}) {
  return {
    ok: options.ok,
    status: options.status,
    // real fetch() responses have a .text() method that returns a Promise —
    // we fake that here by returning a Promise that resolves to a JSON string
    text: async () => JSON.stringify(options.body),
  };
}

describe("apiFetch", () => {
  // "beforeEach" runs BEFORE every single test below — this keeps tests
  // independent from each other, so one test's fake setup can't leak into the next
  beforeEach(() => {
    // vi.stubGlobal replaces the REAL global "fetch" with a brand new fake
    // function for this test only. vi.fn() creates that empty fake function.
    vi.stubGlobal("fetch", vi.fn());
  });

  it("returns the parsed data when the server responds successfully", async () => {
    // tell our fake fetch: "the next time you're called, resolve with this fake response"
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      createFakeResponse({
        ok: true,
        status: 200,
        body: { message: "Logged out" },
      }),
    );

    // call the real apiFetch function we wrote — it will use our FAKE fetch above
    const result = await apiFetch<{ message: string }>("/auth/logout", {
      method: "POST",
    });

    // assert: did apiFetch correctly hand back the parsed JSON data?
    expect(result).toEqual({ message: "Logged out" });
  });

  it("throws an ApiError with the server's message when the response is NOT ok", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      createFakeResponse({
        ok: false,
        status: 400,
        body: { message: "Invalid credentials!" },
      }),
    );

    // We wrap the call in a try/catch because we EXPECT it to throw an error —
    // this is how we test "does my function fail correctly when it should?"
    try {
      await apiFetch("/auth/login", { method: "POST", body: { email: "x" } });
      // if the line above did NOT throw, this test should fail on purpose —
      // because we expected an error and didn't get one
      expect.fail("apiFetch should have thrown an ApiError but it did not");
    } catch (error) {
      // assert: is this really our custom ApiError class, not some random error?
      expect(error).toBeInstanceOf(ApiError);
      // "as ApiError" tells TypeScript "trust me, we already confirmed the type above"
      expect((error as ApiError).message).toBe("Invalid credentials!");
      expect((error as ApiError).status).toBe(400);
    }
  });

  it("sends credentials: include, so the browser attaches auth cookies", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      createFakeResponse({ ok: true, status: 200, body: { user: null } }),
    );

    await apiFetch("/auth/me");

    // fetchMock.mock.calls[0] = the arguments used in the FIRST call to our fake fetch.
    // [0] is the url, [1] is the options object we care about here.
    const optionsUsed = fetchMock.mock.calls[0][1];
    expect(optionsUsed.credentials).toBe("include");
  });

  it("automatically sets Content-Type: application/json when body is a plain object", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      createFakeResponse({ ok: true, status: 200, body: {} }),
    );

    await apiFetch("/cart", {
      method: "POST",
      body: { productId: 1, quantity: 2 }, // a plain JS object, NOT FormData
    });

    const optionsUsed = fetchMock.mock.calls[0][1];
    // Headers objects have a .get() method to read one specific header's value
    const headersUsed = optionsUsed.headers as Headers;
    expect(headersUsed.get("Content-Type")).toBe("application/json");
  });

  it("does NOT set Content-Type when body is FormData (so the browser can set its own)", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      createFakeResponse({ ok: true, status: 201, body: {} }),
    );

    const fakeFormData = new FormData();
    fakeFormData.append("name", "Test Product");

    await apiFetch("/products", {
      method: "POST",
      body: fakeFormData,
    });

    const optionsUsed = fetchMock.mock.calls[0][1];
    const headersUsed = optionsUsed.headers as Headers;
    // .has() checks "does this header exist at all?" — it should NOT exist here
    expect(headersUsed.has("Content-Type")).toBe(false);
  });
});
