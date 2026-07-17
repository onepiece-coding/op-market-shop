/**
 * @file frontend/src/pages/shop/ShopPage.tsx
 */

import { usePagedFetch, useDebouncedValue, usePageMeta } from "@/hooks";
import { Pagination, Input, Spinner } from "@/components/ui";
import { ProductCard } from "@/components/shop";
import { searchProducts } from "@/api/products";
import { cacheKeys } from "@/cache";
import { useState } from "react";

import styles from "./ShopPage.module.css";

const PAGE_SIZE = 8;

export function ShopPage() {
  usePageMeta({
    title: "Shop all products",
    description:
      "Browse our full catalog and find exactly what you're looking for.",
  });

  // the RAW, instantly-updating value from the input's onChange
  const [searchInput, setSearchInput] = useState("");
  // the SETTLED value, only updated 400ms after typing pauses — this is
  // what we actually send to the server, per the "why" section above
  const debouncedSearch = useDebouncedValue(searchInput, 400);

  const {
    data: products,
    page,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,
    pagination,
    isLoading,
    isValidating,
    error,
  } = usePagedFetch(
    (pageNumber) =>
      cacheKeys.products.search({
        q: debouncedSearch,
        page: pageNumber,
        limit: PAGE_SIZE,
      }),
    (pageNumber) =>
      searchProducts({
        q: debouncedSearch,
        page: pageNumber,
        limit: PAGE_SIZE,
      }),
    // 🚩 THE Part 5-C fix in action: every time the user's search term
    // settles on something NEW, we automatically snap back to page 1 —
    // preventing the "empty page 3 of a 1-page search" bug.
    { resetKey: debouncedSearch },
  );

  return (
    <div className={styles.page}>
      <div className={styles.searchRow}>
        <Input
          label="Search products"
          placeholder="Search for anything…"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />
      </div>

      {isLoading && (
        <div className={styles.centered}>
          <Spinner label="Loading products" size="lg" />
        </div>
      )}

      {error && (
        <div role="alert" className={styles.errorBanner}>
          Something went wrong while loading products. Please try again.
        </div>
      )}

      {!isLoading && !error && products.length === 0 && (
        <p className={styles.emptyState}>
          {debouncedSearch
            ? `No products found for "${debouncedSearch}".`
            : "No products available yet."}
        </p>
      )}

      {!isLoading && products.length > 0 && (
        <>
          <div className={styles.grid}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={pagination?.totalPages}
            hasNextPage={hasNextPage}
            hasPrevPage={hasPrevPage}
            onNext={nextPage}
            onPrev={prevPage}
            isLoading={isValidating}
          />
        </>
      )}
    </div>
  );
}
