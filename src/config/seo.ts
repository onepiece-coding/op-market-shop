/**
 * @file frontend/src/config/seo.ts
 */

// One shared source of truth for our app-wide DEFAULT meta values —
// what every page falls back to unless it sets something more specific.
// Centralizing this means the site name/description only ever needs to
// change in ONE place.
export const DEFAULT_SEO = {
  siteName: "op-market",
  title: "op-market — Shop everything, in one place",
  description:
    "Browse and buy a wide range of products on op-market, with fast checkout and secure payments.",
} as const;
