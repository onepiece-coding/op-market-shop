/**
 * @file frontend/src/pages/shop/ProductDetailPage.tsx
 */

import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth, usePageMeta, useToast, useProductJsonLd } from "@/hooks";
import { formatCurrency } from "@/utils/formatCurrency";
import { invalidateExact } from "@/cache/invalidate";
import { Button, Spinner } from "@/components/ui";
import { QuantityInput } from "@/components/shop";
import { getProductById } from "@/api/products";
import { useMutate } from "@/hooks/useMutate";
import { cacheKeys } from "@/cache/cacheKeys";
import { useFetch } from "@/hooks/useFetch";
import { ApiError } from "@/api/ApiError";
import { addToCart } from "@/api/cart";
import { useState } from "react";

import styles from "./ProductDetailPage.module.css";

export function ProductDetailPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [quantity, setQuantity] = useState(1);

  // 🚩 validate the url param BEFORE ever touching the network — mirrors
  // the exact same defensive check your OWN backend controllers use
  // (e.g. getProductByIdCtrl's "if (!Number.isFinite(id))")
  const productId = Number(idParam);
  const isValidId = Number.isFinite(productId);

  const {
    data: product,
    isLoading,
    error,
  } = useFetch(
    cacheKeys.products.detail(productId),
    () => getProductById(productId),
    { enabled: isValidId },
  );

  // both hooks are called UNCONDITIONALLY, every render — exactly the
  // same "hooks must run in a stable order" rule we followed for
  // PayPalWarningScreen (8-F) and OrderRow (9-C). Each hook internally
  // guards its own "do nothing if there's no product yet" case.
  usePageMeta({
    title: product?.name ?? "Product",
    description: product?.description,
    image: product?.imageUrl ?? undefined,
  });
  useProductJsonLd(product);

  const { mutate: addItem, isLoading: isAdding } = useMutate(addToCart, {
    onSuccess: (_data, _variables, store) => {
      // STRATEGY 1 from Part 4-C: exact-key removal. The Header's cart
      // badge (Part 8-A) and any future Cart page share this SAME key,
      // so both update automatically the instant this succeeds.
      invalidateExact(store, cacheKeys.cart.all());
      showToast("Added to cart!", "success");
    },
    onError: () => {
      showToast(
        "Could not add this item to your cart. Please try again.",
        "error",
      );
    },
  });

  function handleAddToCart() {
    // 🚩 check auth BEFORE attempting the mutation,
    // rather than letting it fail with a confusing 401.
    // We carry "from" exactly like ProtectedRoute does
    // (Part 6-B), so a successful login sends them right back here.
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location } });
      return;
    }

    addItem({ productId, quantity });
  }

  if (!isValidId) {
    return (
      <div className={styles.notFound}>
        <h1>Product not found</h1>
        <p>This product link looks incorrect.</p>
        <Link to="/">Back to shop</Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.centered}>
        <Spinner label="Loading product" size="lg" />
      </div>
    );
  }

  // 🚩 distinguishes "genuinely doesn't exist" (404) from any other kind
  // of failure — see the "why" section for exactly why this matters
  if (error instanceof ApiError && error.status === 404) {
    return (
      <div className={styles.notFound}>
        <h1>Product not found</h1>
        <p>This product may have been removed or never existed.</p>
        <Link to="/">Back to shop</Link>
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className={styles.errorBanner}>
        Something went wrong while loading this product. Please try again.
      </div>
    );
  }

  if (!product) return null; // satisfies TypeScript; unreachable once loading/error are handled above

  // same two Part 2-A gotchas as ProductCard (Part 8-B): price is a
  // string that needs Number(), tags is a comma-joined string that
  // needs splitting — repeated here since this page shows the FULL
  // product, not the summarized card version
  const priceNumber = Number(product.price);
  const tagList = product.tags.split(",").filter(Boolean);

  return (
    <div className={styles.page}>
      <div className={styles.imageColumn}>
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            // 🚩 the important nuance from our "why" section: this is
            // almost certainly the page's LCP (Largest Contentful Paint)
            // element — deliberately NOT lazy, and fetchPriority="high"
            // tells the browser "fetch this before other equal-priority
            // resources," since delaying it would directly hurt the
            // metric we're trying to improve.
            fetchPriority="high"
            decoding="async"
            width={600}
            height={600}
            className={styles.image}
          />
        ) : (
          <div className={styles.imagePlaceholder}>No image</div>
        )}
      </div>

      <div className={styles.detailsColumn}>
        <h1 className={styles.name}>{product.name}</h1>
        <p className={styles.price}>{formatCurrency(priceNumber)}</p>
        <p className={styles.description}>{product.description}</p>

        {tagList.length > 0 && (
          <ul className={styles.tags}>
            {tagList.map((tag) => (
              <li key={tag} className={styles.tag}>
                {tag}
              </li>
            ))}
          </ul>
        )}

        <div className={styles.addToCartRow}>
          <QuantityInput value={quantity} onChange={setQuantity} />
          <Button onClick={handleAddToCart} isLoading={isAdding}>
            Add to cart
          </Button>
        </div>
      </div>
    </div>
  );
}
