/**
 * @file frontend/api/config.ts
 */

// import.meta.env is Vite's special object holding all your VITE_-prefixed variables.
// If VITE_API_BASE_URL is missing for some reason, we fall back to a sensible default
// so the app doesn't completely break — just makes it obvious something's misconfigured.
export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ??
  "https://op-market-backend.onrender.com/api/v1";
