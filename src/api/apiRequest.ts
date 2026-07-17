/**
 * @file frontend/api/apiRequest.ts
 */

import { triggerAuthExpired } from "./authExpiredHandler";
import type { ApiFetchOptions } from "./apiFetch";
import { apiFetch } from "./apiFetch";
import { ApiError } from "./ApiError";

// This variable holds the "in-progress refresh" promise, shared by everyone.
// "Promise<boolean> | null" means: either nobody is currently refreshing (null),
// or there IS a refresh happening right now, and this holds that ongoing promise.
let refreshPromise: Promise<boolean> | null = null;

// This function makes sure only ONE real network call to /auth/refresh
// ever happens at a time, no matter how many places call it "at once".
function refreshAccessToken(): Promise<boolean> {
  // if a refresh is ALREADY happening, don't start a second one —
  // just hand back the SAME promise everyone else is already waiting on
  if (refreshPromise) {
    return refreshPromise;
  }

  // no refresh in progress yet — start one now, and IMMEDIATELY store the
  // promise (before any "await" happens), so any other call arriving in the
  // next few milliseconds sees "refreshPromise" is already set, and reuses it
  refreshPromise = apiFetch("/auth/refresh", { method: "POST" })
    .then(() => true) // request succeeded → refresh worked → return true
    .catch(() => false) // request failed (401 or network error) → return false
    .finally(() => {
      // once the refresh attempt is fully done (success OR failure),
      // clear this variable so the NEXT expired token can trigger a fresh refresh
      refreshPromise = null;
    });

  return refreshPromise;
}

/**
 * apiRequest wraps apiFetch with automatic session-refresh behavior.
 * Every endpoint function we write in Part 3-C will call THIS function,
 * not apiFetch directly, so every protected request gets this protection for free.
 */
export async function apiRequest<T>(
  endpoint: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  try {
    // try the request normally first — most of the time, this just works
    return await apiFetch<T>(endpoint, options);
  } catch (error) {
    // GOTCHA GUARD: never attempt to "refresh the refresh" — that would loop forever.
    const isRefreshEndpointItself = endpoint === "/auth/refresh";

    // only step in if this is truly an expired-session error (401),
    // and it wasn't the refresh call itself that failed
    if (
      error instanceof ApiError &&
      error.status === 401 &&
      !isRefreshEndpointItself
    ) {
      // ask for a refresh (this call is deduplicated automatically)
      const refreshed = await refreshAccessToken();

      if (refreshed) {
        // refresh worked! the browser now has a fresh accessToken cookie —
        // try the ORIGINAL request one more time, and return whatever it gives us
        return await apiFetch<T>(endpoint, options);
      }

      // refresh did NOT work — the user's session is genuinely over.
      // tell whoever registered a handler (our future AuthContext) to react
      // (e.g. clear the logged-in user and redirect to the login page)
      triggerAuthExpired();
    }

    // in every other case (not a 401, or refresh failed), we let the
    // original error keep going "up" to whoever called apiRequest,
    // so THEY can show an error message to the user
    throw error;
  }
}
