/**
 * @file frontend/src/hooks/usePageMeta.ts
 */

import { setMetaName, setMetaProperty, setCanonicalLink } from "@/utils";
import { DEFAULT_SEO } from "@/config/seo";
import { useEffect } from "react";

export interface UsePageMetaOptions {
  title: string; // shown WITHOUT the site name suffix — we add that automatically
  description?: string;
  image?: string; // for Open Graph / social link previews
  noIndex?: boolean; // see Gotcha 3 in our "why" section — auth-gated pages set this true
}

/**
 * Sets document.title, meta description, Open Graph tags, the canonical
 * link, and the robots meta tag for whichever page calls this. On
 * unmount, everything is reset back to the app-wide DEFAULT_SEO values —
 * so navigating AWAY from a page never leaves its specific title/
 * description lingering on the next page by mistake.
 */
export function usePageMeta({
  title,
  description = DEFAULT_SEO.description,
  image,
  noIndex = false,
}: UsePageMetaOptions): void {
  useEffect(() => {
    const fullTitle = `${title} | ${DEFAULT_SEO.siteName}`;
    document.title = fullTitle;

    setMetaName("description", description);
    setMetaProperty("og:title", fullTitle);
    setMetaProperty("og:description", description);
    setMetaProperty("og:site_name", DEFAULT_SEO.siteName);
    if (image) setMetaProperty("og:image", image);

    // canonical always points at the CURRENT path, with no query string —
    // this is the fix for Gotcha 2: /?q=phone and /?q=phone&page=2 both
    // canonicalize back to the same clean base url for their route.
    setCanonicalLink(`${window.location.origin}${window.location.pathname}`);

    // 🚩 Gotcha 3 from our "why" section: an explicit second layer of
    // defense on top of ProtectedRoute's client-side redirect, which a
    // partially-JS-executing crawler might not fully respect.
    setMetaName("robots", noIndex ? "noindex, nofollow" : "index, follow");

    // CLEANUP: reset everything back to app-wide defaults the instant
    // this page unmounts — e.g. navigating from ProductDetailPage
    // (custom title/image) to the Shop page should never leave the
    // PREVIOUS product's title sitting in the browser tab.
    return () => {
      document.title = DEFAULT_SEO.title;
      setMetaName("description", DEFAULT_SEO.description);
      setMetaProperty("og:title", DEFAULT_SEO.title);
      setMetaProperty("og:description", DEFAULT_SEO.description);
      setMetaName("robots", "index, follow");
    };
  }, [title, description, image, noIndex]);
}
