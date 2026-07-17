/**
 * @file frontend/src/pages/admin/AdminProductsPage.tsx
 */

import type { Product, ProductFormInput } from "@/types/product";
import { usePagedFetch, useToast, useMutate, usePageMeta } from "@/hooks";
import { invalidateByPrefix, cacheKeys } from "@/cache";
import { ProductForm } from "@/components/admin";
import { Icon } from "@/components/icons";
import { formatCurrency } from "@/utils";
import { useState } from "react";
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/api/products";
import {
  Modal,
  ConfirmDialog,
  Button,
  Spinner,
  Pagination,
} from "@/components/ui";

import styles from "./AdminProductsPage.module.css";

const PAGE_SIZE = 10;

// same discriminated-union pattern as SignupPage's ScreenState (Part
// 6-C-2) — makes "edit modal open, but with the WRONG product" a state
// that literally cannot be constructed
type DialogState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; product: Product }
  | { mode: "delete"; product: Product };

export function AdminProductsPage() {
  usePageMeta({ title: "Admin — Products", noIndex: true });

  const { showToast } = useToast();
  const [dialog, setDialog] = useState<DialogState>({ mode: "closed" });

  // 🚩 THE payoff from Part 3-C-2's gotcha: listProducts is the
  // admin-only endpoint flagged back then as unusable for the public
  // Shop page. This is the one place in the whole app allowed to call it.
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
      cacheKeys.products.list({ page: pageNumber, limit: PAGE_SIZE }),
    (pageNumber) => listProducts({ page: pageNumber, limit: PAGE_SIZE }),
  );

  const { mutate: create, isLoading: isCreating } = useMutate(createProduct, {
    onSuccess: (_data, _variables, store) => {
      // STRATEGY 2 from Part 4-C: wipes every "products:" key — this
      // admin list AND the public search cache both go stale together.
      invalidateByPrefix(store, "products:");
      showToast("Product created.", "success");
      setDialog({ mode: "closed" });
    },
  });

  const { mutate: update, isLoading: isUpdating } = useMutate(
    (input: { id: number; data: Partial<ProductFormInput> }) =>
      updateProduct(input.id, input.data),
    {
      onSuccess: (_data, _variables, store) => {
        invalidateByPrefix(store, "products:");
        showToast("Product updated.", "success");
        setDialog({ mode: "closed" });
      },
    },
  );

  const { mutate: remove, isLoading: isDeleting } = useMutate(deleteProduct, {
    onSuccess: (_data, _variables, store) => {
      invalidateByPrefix(store, "products:");
      showToast("Product deleted.", "success");
      setDialog({ mode: "closed" });
    },
    onError: () => {
      showToast("Could not delete this product. Please try again.", "error");
    },
  });

  async function handleCreate(input: ProductFormInput) {
    await create(input);
  }

  async function handleEdit(input: ProductFormInput) {
    if (dialog.mode !== "edit") return;
    await update({ id: dialog.product.id, data: input });
  }

  if (isLoading) {
    return (
      <div className={styles.centered}>
        <Spinner label="Loading products" size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className={styles.errorBanner}>
        Something went wrong while loading products. Please try again.
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Products</h1>
        <Button onClick={() => setDialog({ mode: "create" })}>
          <Icon name="plus" />
          Add product
        </Button>
      </div>

      {products.length === 0 ? (
        <p className={styles.emptyState}>No products yet.</p>
      ) : (
        // Wrap the table in its own scroll container. On a
        // narrow screen, THIS div scrolls sideways — the page around it
        // never does — and the table itself is never forced to crush
        // its own columns to fit, since it's allowed to be wider than
        // its wrapper and just scroll instead.
        <div
          className={styles.tableWrapper}
          data-testid="products-table-wrapper"
        >
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Image</th>
                <th scope="col">Name</th>
                <th scope="col">Price</th>
                <th scope="col">Tags</th>
                <th scope="col" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        className={styles.thumbnail}
                      />
                    ) : (
                      <div className={styles.thumbnailPlaceholder}>
                        No image
                      </div>
                    )}
                  </td>
                  <td>{product.name}</td>
                  <td>{formatCurrency(Number(product.price))}</td>
                  <td className={styles.tagsCell}>{product.tags}</td>
                  <td className={styles.actionsCell}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDialog({ mode: "edit", product })}
                      aria-label={`Edit ${product.name}`}
                    >
                      <Icon name="edit" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDialog({ mode: "delete", product })}
                      aria-label={`Delete ${product.name}`}
                    >
                      <Icon name="trash" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={page}
        totalPages={pagination?.totalPages}
        hasNextPage={hasNextPage}
        hasPrevPage={hasPrevPage}
        onNext={nextPage}
        onPrev={prevPage}
        isLoading={isValidating}
      />

      <Modal
        isOpen={dialog.mode === "create"}
        onClose={() => setDialog({ mode: "closed" })}
        title="Add a new product"
      >
        <ProductForm
          onSubmit={handleCreate}
          onCancel={() => setDialog({ mode: "closed" })}
          isSubmitting={isCreating}
        />
      </Modal>

      <Modal
        isOpen={dialog.mode === "edit"}
        onClose={() => setDialog({ mode: "closed" })}
        title="Edit product"
      >
        {dialog.mode === "edit" && (
          <ProductForm
            initialProduct={dialog.product}
            onSubmit={handleEdit}
            onCancel={() => setDialog({ mode: "closed" })}
            isSubmitting={isUpdating}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={dialog.mode === "delete"}
        onClose={() => setDialog({ mode: "closed" })}
        onConfirm={() => {
          if (dialog.mode === "delete") remove(dialog.product.id);
        }}
        title="Delete product?"
        message={
          dialog.mode === "delete"
            ? `Are you sure you want to delete "${dialog.product.name}"? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
