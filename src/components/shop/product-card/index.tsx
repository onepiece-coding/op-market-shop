/**
 * @file frontend/src/components/shop/product-card/index.tsx
 */

import { formatCurrency } from "@/utils/formatCurrency";
import type { Product } from "@/types/product";
import { Link } from "react-router-dom";

import styles from "./styles.module.css";
import { memo } from "react";

export interface ProductCardProps {
  product: Product;
}

// React.memo wraps this component so React skips
// re-rendering it entirely when its props are UNCHANGED, even if its
// PARENT (ShopPage) re-renders for an unrelated reason (like search
// input state updating on every keystroke). This only works cleanly
// because "product" is always a STABLE object reference from our cache
// (Part 4-A) — no inline objects/functions are passed as props here that
// would defeat the comparison.
export const ProductCard = memo(function ProductCard({
  product,
}: ProductCardProps) {
  // 🚩 Part 2-A Gotcha #2: price arrives as a STRING ("49.99"), because
  // Prisma's Decimal type serializes to text over JSON. We convert to a
  // real number here, at the LAST possible moment, right before display.
  const priceNumber = Number(product.price);

  // 🚩 Part 2-A Gotcha: tags arrives as ONE comma-joined string
  // ("electronics,phone,sale"), NOT a real array — we split it ourselves.
  // .filter(Boolean) also protects us if tags is an empty string at all,
  // which would otherwise produce one useless empty-string "tag".
  const tagList = product.tags.split(",").filter(Boolean);

  return (
    <Link to={`/products/${product.id}`} className={styles.card}>
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt={product.name}
          // 🚩 Gap 2's fix: this grid can hold many images, most of
          // them below the fold on load — "lazy" defers fetching each
          // one until it's about to scroll into view, so the visible
          // "above the fold" images aren't competing with them for
          // bandwidth on initial load.
          loading="lazy"
          decoding="async"
          // width/height (matching our square design's aspect ratio)
          // let the browser reserve the correct space BEFORE the image
          // finishes loading, preventing the page from visibly jumping
          // around as images pop in (a real, measured metric called CLS).
          width={400}
          height={400}
          className={styles.image}
        />
      ) : (
        // no imageKey/imageUrl means this admin never uploaded a photo —
        // we show a clearly-labeled placeholder instead of a broken <img>
        <div className={styles.imagePlaceholder}>No image</div>
      )}

      <div className={styles.body}>
        <h3 className={styles.name}>{product.name}</h3>
        <p className={styles.price}>{formatCurrency(priceNumber)}</p>

        {tagList.length > 0 && (
          <ul className={styles.tags}>
            {/* showing at most 3 tags keeps cards a consistent height in the grid */}
            {tagList.slice(0, 3).map((tag) => (
              <li key={tag} className={styles.tag}>
                {tag}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Link>
  );
});
