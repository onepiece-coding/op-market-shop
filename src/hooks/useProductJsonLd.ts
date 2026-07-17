/**
 * @file frontend/src/hooks/useProductJsonLd.ts
 */

import { setJsonLd, removeJsonLd } from "@/utils";
import type { Product } from "@/types/product";
import { useEffect } from "react";

const JSON_LD_ID = "product-jsonld";

/**
 * Injects schema.org Product structured data for a single product page.
 * This is one of the few SEO wins that works reasonably well even
 * without SSR — Googlebot specifically looks for this AFTER rendering
 * JS, unlike link-preview bots which don't run JS at all.
 */
export function useProductJsonLd(product: Product | undefined): void {
  useEffect(() => {
    if (!product) return;

    // same Part 2-A gotcha we've handled everywhere else: price arrives
    // as a string, we convert it once more here for the schema's number
    const priceNumber = Number(product.price);

    setJsonLd(JSON_LD_ID, {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description,
      image: product.imageUrl ?? undefined,
      offers: {
        "@type": "Offer",
        priceCurrency: "USD",
        price: priceNumber.toFixed(2),
        availability: "https://schema.org/InStock",
      },
    });

    return () => removeJsonLd(JSON_LD_ID);
  }, [product]);
}
