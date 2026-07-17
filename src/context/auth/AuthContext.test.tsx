/**
 * @file frontend/src/context/AuthContext.test.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { triggerAuthExpired } from "@/api/authExpiredHandler";
import { AuthProvider } from "./AuthProvider";
import { useAuth } from "@/hooks";
import {
  render,
  screen,
  waitFor,
  act,
  fireEvent,
} from "@testing-library/react";

// This REPLACES the real "@/api/auth" module for every test in this file.
// Every function it normally exports becomes an empty fake function (vi.fn())
// that we configure individually inside each test below with .mockResolvedValue()
// or .mockRejectedValue() — so NO real network call ever happens here.
vi.mock("@/api/auth", () => ({
  getMe: vi.fn(),
  login: vi.fn(),
  signUp: vi.fn(),
  logout: vi.fn(),
  verifyEmail: vi.fn(),
  updateUser: vi.fn(),
}));
vi.mock("@/api/users", () => ({
  updateUser: vi.fn(),
}));

// now we import the (fake) functions so we can configure their behavior
// in each test, and later check "was this called correctly?"
import {
  getMe,
  login,
  signUp,
  // logout
} from "@/api/auth";
import { CacheProvider } from "@/cache";
import { updateUser } from "@/api/users";

// A small test-only component that displays everything useAuth() gives us,
// and has buttons to trigger each action — this lets our tests interact
// with AuthContext exactly the way a real component would.
function AuthDisplay() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="initializing">{String(auth.isInitializing)}</span>
      <span data-testid="user">{auth.user ? auth.user.name : "none"}</span>
      <span data-testid="authenticated">{String(auth.isAuthenticated)}</span>
      <button
        onClick={() =>
          auth.login({ email: "a@test.com", password: "pass1234" })
        }
      >
        Login
      </button>
      <button
        onClick={() =>
          auth.signUp({
            name: "New",
            email: "n@test.com",
            password: "pass1234",
          })
        }
      >
        SignUp
      </button>
      <button onClick={() => auth.logout()}>Logout</button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    // clears each mock function's call history AND any .mockResolvedValue()
    // configuration from the PREVIOUS test, so tests never leak into each other
    vi.clearAllMocks();
  });

  it("starts with isInitializing true, then becomes false once getMe() resolves", async () => {
    (getMe as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      name: "Lahcen",
    });

    render(
      <CacheProvider>
        <AuthProvider>
          <AuthDisplay />
        </AuthProvider>
      </CacheProvider>,
    );

    // right after mount, we haven't heard back from getMe() yet — this is
    // the exact window route guards (Part 6-B) must wait through
    expect(screen.getByTestId("initializing").textContent).toBe("true");

    await waitFor(() =>
      expect(screen.getByTestId("initializing").textContent).toBe("false"),
    );

    expect(screen.getByTestId("user").textContent).toBe("Lahcen");
    expect(screen.getByTestId("authenticated").textContent).toBe("true");
  });

  it("treats a failed getMe() as 'not logged in', not as an error", async () => {
    (getMe as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Unauthorized!"),
    );

    render(
      <CacheProvider>
        <AuthProvider>
          <AuthDisplay />
        </AuthProvider>
      </CacheProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("initializing").textContent).toBe("false"),
    );

    expect(screen.getByTestId("user").textContent).toBe("none");
    expect(screen.getByTestId("authenticated").textContent).toBe("false");
  });

  it("login() sets the user from the response", async () => {
    (getMe as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Unauthorized!"),
    );
    (login as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: 2, name: "Fresh Login" },
    });

    render(
      <CacheProvider>
        <AuthProvider>
          <AuthDisplay />
        </AuthProvider>
      </CacheProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("initializing").textContent).toBe("false"),
    );
    expect(screen.getByTestId("user").textContent).toBe("none");

    // "act" tells React "a real state-changing action is happening on
    // purpose — please fully process it before the test checks anything else"
    await act(async () => {
      fireEvent.click(screen.getByText("Login"));
      await Promise.resolve(); // give the login() promise a tick to resolve
    });

    await waitFor(() =>
      expect(screen.getByTestId("user").textContent).toBe("Fresh Login"),
    );
  });

  it("signUp() does NOT log the user in (backend requires email verification first)", async () => {
    (getMe as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Unauthorized!"),
    );
    (signUp as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: 3, name: "New" },
      verificationEmailSent: true,
      message: "Check your email",
    });

    render(
      <CacheProvider>
        <AuthProvider>
          <AuthDisplay />
        </AuthProvider>
      </CacheProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("initializing").textContent).toBe("false"),
    );

    await act(async () => {
      fireEvent.click(screen.getByText("SignUp"));
      await Promise.resolve();
    });

    // even though signUp "succeeded" and returned a real user object,
    // AuthContext must still show them as logged OUT
    expect(screen.getByTestId("user").textContent).toBe("none");
    expect(screen.getByTestId("authenticated").textContent).toBe("false");
  });

  /* it("logout() clears the user even when the logout API call itself fails", async () => {
    (getMe as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      name: "Lahcen",
    });
    (logout as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Network error"),
    );

    render(
      <AuthProvider>
        <AuthDisplay />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("user").textContent).toBe("Lahcen"),
    );

    await act(async () => {
      fireEvent.click(screen.getByText("Logout"));
      // the logout() call is expected to fail internally — this just lets
      // its promise settle before we check anything
      await Promise.resolve().catch(() => {});
    });

    await waitFor(() =>
      expect(screen.getByTestId("user").textContent).toBe("none"),
    );
  }); */

  it("clears the user when triggerAuthExpired() fires (a session dying mid-use)", async () => {
    (getMe as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      name: "Lahcen",
    });

    render(
      <CacheProvider>
        <AuthProvider>
          <AuthDisplay />
        </AuthProvider>
      </CacheProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("user").textContent).toBe("Lahcen"),
    );

    // this simulates exactly what apiRequest.ts (Part 3-B) does internally
    // when a 401 happens and even a refresh attempt fails
    act(() => {
      triggerAuthExpired();
    });

    await waitFor(() =>
      expect(screen.getByTestId("user").textContent).toBe("none"),
    );
  });

  it("useAuth throws a clear error when used outside of an AuthProvider", () => {
    // silence React's own console.error about the thrown render error,
    // so our test output stays clean — this does not hide test pass/fail
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    function Broken() {
      useAuth();
      return null;
    }

    expect(() => render(<Broken />)).toThrow(
      "useAuth must be used inside an <AuthProvider>",
    );

    consoleSpy.mockRestore();
  });

  it("verifyEmail() sets the user from the response (unlike signUp, this DOES log the user in)", async () => {
    (getMe as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Unauthorized!"),
    );

    // "verifyEmail" isn't in our vi.mock list yet from earlier in this file —
    // add it there too: verifyEmail: vi.fn(), alongside getMe/login/signUp/logout
    const { verifyEmail } = await import("@/api/auth");
    (verifyEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: 4, name: "Verified User" },
      message: "Email verified successfully.",
    });

    function VerifyDisplay() {
      const auth = useAuth();
      return (
        <div>
          <span data-testid="user">{auth.user ? auth.user.name : "none"}</span>
          <button onClick={() => auth.verifyEmail("sometoken")}>Verify</button>
        </div>
      );
    }

    render(
      <CacheProvider>
        <AuthProvider>
          <VerifyDisplay />
        </AuthProvider>
      </CacheProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("user").textContent).toBe("none"),
    );

    await act(async () => {
      fireEvent.click(screen.getByText("Verify"));
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(screen.getByTestId("user").textContent).toBe("Verified User"),
    );
  });

  it("updateProfile() sends the input and updates the shared user state", async () => {
    (getMe as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      name: "Old Name",
    });
    (updateUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      name: "New Name",
    });

    function ProfileDisplay() {
      const auth = useAuth();
      return (
        <div>
          <span data-testid="user">{auth.user?.name}</span>
          <button onClick={() => auth.updateProfile({ name: "New Name" })}>
            Save
          </button>
        </div>
      );
    }

    render(
      <CacheProvider>
        <AuthProvider>
          <ProfileDisplay />
        </AuthProvider>
      </CacheProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("user").textContent).toBe("Old Name"),
    );

    await act(async () => {
      fireEvent.click(screen.getByText("Save"));
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(screen.getByTestId("user").textContent).toBe("New Name"),
    );
  });
});
