import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  signUp,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  refresh,
  logout,
  getMe,
} from "./auth";

// same fake-response helper we've used in every test file so far —
// it stands in for what a real fetch() Response object looks like
function createFakeResponse(body: unknown) {
  return {
    ok: true, // pretend every call in this file succeeds — we're testing REQUESTS, not error handling
    status: 200,
    text: async () => JSON.stringify(body),
  };
}

describe("auth API functions", () => {
  beforeEach(() => {
    // fresh fake fetch before every single test, so no test can affect another
    vi.stubGlobal("fetch", vi.fn());
  });

  it("signUp sends a POST to /auth/signup with the name, email, and password", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      createFakeResponse({
        user: { id: 1 },
        verificationEmailSent: true,
        message: "ok",
      }),
    );

    await signUp({
      name: "Lahcen",
      email: "l@test.com",
      password: "secret123",
    });

    // mock.calls[0] = the arguments used on the FIRST (and only) fetch call
    const [urlUsed, optionsUsed] = fetchMock.mock.calls[0];
    expect(urlUsed).toContain("/auth/signup"); // correct endpoint
    expect(optionsUsed.method).toBe("POST"); // correct HTTP method
    // the body we sent gets JSON-stringified inside apiFetch, so we parse it
    // back here to check its actual contents matched what we passed in
    expect(JSON.parse(optionsUsed.body)).toEqual({
      name: "Lahcen",
      email: "l@test.com",
      password: "secret123",
    });
  });

  it("login sends a POST to /auth/login with email and password", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(createFakeResponse({ user: { id: 1 } }));

    await login({ email: "l@test.com", password: "secret123" });

    const [urlUsed, optionsUsed] = fetchMock.mock.calls[0];
    expect(urlUsed).toContain("/auth/login");
    expect(optionsUsed.method).toBe("POST");
    expect(JSON.parse(optionsUsed.body)).toEqual({
      email: "l@test.com",
      password: "secret123",
    });
  });

  it("verifyEmail sends a GET request with the token safely placed in the URL", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      createFakeResponse({ user: { id: 1 }, message: "verified" }),
    );

    await verifyEmail("abc123token");

    const [urlUsed, optionsUsed] = fetchMock.mock.calls[0];
    expect(urlUsed).toContain("/auth/verify-email?token=abc123token");
    expect(optionsUsed.method).toBe("GET");
    // GET requests should never have a body attached
    expect(optionsUsed.body).toBeUndefined();
  });

  it("resendVerification sends a POST with the email", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(createFakeResponse({ message: "sent" }));

    await resendVerification({ email: "l@test.com" });

    const [urlUsed, optionsUsed] = fetchMock.mock.calls[0];
    expect(urlUsed).toContain("/auth/resend-verification");
    expect(JSON.parse(optionsUsed.body)).toEqual({ email: "l@test.com" });
  });

  it("forgotPassword sends a POST with the email", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(createFakeResponse({ message: "sent" }));

    await forgotPassword({ email: "l@test.com" });

    const [urlUsed, optionsUsed] = fetchMock.mock.calls[0];
    expect(urlUsed).toContain("/auth/forgot-password");
    expect(optionsUsed.method).toBe("POST");
    expect(JSON.parse(optionsUsed.body)).toEqual({ email: "l@test.com" });
  });

  it("resetPassword sends a POST with token and new password", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      createFakeResponse({ user: { id: 1 }, message: "reset" }),
    );

    await resetPassword({ token: "abc123", password: "newpass123" });

    const [urlUsed, optionsUsed] = fetchMock.mock.calls[0];
    expect(urlUsed).toContain("/auth/reset-password");
    expect(JSON.parse(optionsUsed.body)).toEqual({
      token: "abc123",
      password: "newpass123",
    });
  });

  it("refresh sends a POST to /auth/refresh with no body", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(createFakeResponse({ user: { id: 1 } }));

    await refresh();

    const [urlUsed, optionsUsed] = fetchMock.mock.calls[0];
    expect(urlUsed).toContain("/auth/refresh");
    expect(optionsUsed.method).toBe("POST");
    expect(optionsUsed.body).toBeUndefined();
  });

  it("logout sends a POST to /auth/logout", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      createFakeResponse({ message: "Logged out" }),
    );

    await logout();

    const [urlUsed, optionsUsed] = fetchMock.mock.calls[0];
    expect(urlUsed).toContain("/auth/logout");
    expect(optionsUsed.method).toBe("POST");
  });

  it("getMe sends a GET to /auth/me and returns the user directly", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      createFakeResponse({ id: 1, name: "Lahcen" }),
    );

    const result = await getMe();

    const [urlUsed] = fetchMock.mock.calls[0];
    expect(urlUsed).toContain("/auth/me");
    // getMe should hand back the user object directly — no wrapper like { user: ... }
    expect(result).toEqual({ id: 1, name: "Lahcen" });
  });
});
