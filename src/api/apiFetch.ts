/**
 * @file frontend/api/apiFetch.ts
 */

import type { ApiErrorBody } from "@/types/api";
import { API_BASE_URL } from "./config";
import { ApiError } from "./ApiError";

// This describes what you're allowed to pass into apiFetch.
// "Omit<RequestInit, 'body'>" means: take fetch()'s normal options type,
// but REMOVE its "body" field, because we're replacing it with our own
// smarter version right below (one that accepts a plain object OR FormData).
export type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown; // can be: left out, a plain JS object, or a FormData instance
};

/**
 * apiFetch talks to our backend for us.
 * "<T>" is a placeholder type — whoever CALLS this function tells us what
 * shape of data to expect back, e.g. apiFetch<LoginResponse>("/auth/login", ...).
 */
export async function apiFetch<T>(
  endpoint: string,
  options: ApiFetchOptions = {}, // if nothing is passed, default to an empty object
): Promise<T> {
  // glue the base url and the specific endpoint together,
  // e.g. "http://localhost:3000/api/v1" + "/auth/login"
  const url = `${API_BASE_URL}${endpoint}`;

  // "Headers" is a built-in browser tool for building a list of request headers.
  // We start with whatever headers the caller already gave us (often none).
  const headers = new Headers(options.headers);

  // this will hold the FINAL body we actually send in the request
  let bodyToSend: BodyInit | undefined;

  if (options.body instanceof FormData) {
    // FormData (used for image uploads) is sent AS-IS.
    // We deliberately do NOT set a Content-Type header here — the browser
    // sets its own special one automatically, including a required "boundary" value.
    bodyToSend = options.body;
  } else if (options.body !== undefined) {
    // any other body (a plain object) gets converted into a JSON text string
    bodyToSend = JSON.stringify(options.body);
    // and we tell the server "hey, this body is JSON text"
    headers.set("Content-Type", "application/json");
  }
  // if options.body was never given at all, bodyToSend stays "undefined" —
  // fine for GET requests, which don't send a body.

  // this is the actual network call to your Express backend
  const response = await fetch(url, {
    ...options, // keep any other options the caller passed (like "method")
    headers,
    body: bodyToSend,
    // THIS is the critical line: tells the browser "attach my httpOnly
    // cookies (accessToken, refreshToken) to this request automatically".
    credentials: "include",
  });

  // We read the response body as plain text first, because some responses
  // could theoretically be empty (zero characters), and calling .json() on
  // an empty response would crash with a confusing error.
  const text = await response.text();

  // "unknown" means "some value exists, but we don't yet know its shape" —
  // safer than "any", which would turn OFF type-checking completely.
  let data: unknown = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // if the server ever sends back broken/non-JSON text, don't crash —
      // just leave "data" as null, and let the error-handling below deal with it
      data = null;
    }
  }

  // response.ok is TRUE for status codes 200–299, and FALSE for 4xx/5xx errors.
  // This is fetch()'s built-in way of telling us "something went wrong".
  if (!response.ok) {
    // "as Partial<ApiErrorBody>" means: treat this data as an ApiErrorBody,
    // but treat every field as OPTIONAL (might be missing), since we can't be
    // 100% sure the server sent a well-formed error body every time.
    const errorBody = (data ?? {}) as Partial<ApiErrorBody>;

    throw new ApiError(
      errorBody.message ?? "Something went wrong. Please try again.",
      response.status,
      errorBody.errors,
    );
  }

  // "as T" tells TypeScript: "trust me, this data matches the shape the
  // CALLER asked for". TypeScript can't verify this on its own at runtime —
  // it's up to us to call apiFetch<CorrectType> honestly every time.
  return data as T;
}
