/**
 * @file frontend/src/utils/queryString.ts
 */

// This function turns an object like { page: 2, limit: 10, q: undefined }
// into a URL-ready string like "?page=2&limit=10" — automatically SKIPPING
// any values that are undefined, null, or an empty string, so we never send
// a useless "?q=" to the backend.
export function buildQueryString(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  // URLSearchParams is a built-in browser tool specifically for building
  // and encoding query strings safely (handles special characters for us)
  const searchParams = new URLSearchParams();

  // Object.entries turns { page: 2, limit: 10 } into [["page", 2], ["limit", 10]]
  // so we can loop over each key/value pair one at a time
  for (const [key, value] of Object.entries(params)) {
    // skip anything "empty" — we don't want "?q=undefined" | "?q=" in our URL
    if (value === undefined || value === null || value === "") continue;
    // String(value) converts numbers/booleans into text, since URLs are always text
    searchParams.set(key, String(value)); // ?page=2&limit=10
  }

  const queryString = searchParams.toString();
  // only add the leading "?" if there's actually something to put after it
  return queryString ? `?${queryString}` : "";
}
