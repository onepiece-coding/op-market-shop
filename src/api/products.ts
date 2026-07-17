/**
 * @file frontend/src/api/products.ts
 */

import { apiRequest } from "./apiRequest";
import { buildQueryString } from "@/utils/queryString";
import type {
  Product,
  ProductFormInput,
  ProductQueryParams,
  ProductSearchParams,
  DeleteProductResponse,
} from "@/types/product";
import type { PaginatedResponse } from "@/types/api";
import type { ID } from "@/types/common";

// This is a small PRIVATE helper (no "export"), only used inside this file.
// It converts our friendly ProductFormInput shape into a real FormData object,
// matching exactly what multer's singleImage("image") middleware expects.
// "Partial<ProductFormInput>" means every field is OPTIONAL here — useful for
// updateProduct, where an admin might only change the price and leave everything else.
function buildProductFormData(input: Partial<ProductFormInput>): FormData {
  const formData = new FormData();

  // we only append a field if it was actually given — this matters most for
  // updateProductCtrl, which explicitly falls back to the EXISTING value on
  // the backend whenever a field is missing from the request (see: "?? existingProduct.name")
  if (input.name !== undefined) formData.append("name", input.name);
  if (input.description !== undefined)
    formData.append("description", input.description);
  // FormData can only hold strings and files — never raw numbers — so we convert
  if (input.price !== undefined) formData.append("price", String(input.price));
  // the backend's tagsSchema accepts a comma-joined string just fine (it splits
  // it back into an array itself), so we join our friendly array here
  if (input.tags !== undefined) formData.append("tags", input.tags.join(","));
  // the field name "image" MUST exactly match singleImage("image") on the backend,
  // or multer will silently never attach the file to req.file
  if (input.image) formData.append("image", input.image);

  return formData;
}

// ---- GET /api/v1/products/search ----
// 🚩 THIS is our PUBLIC "browse all products" function — used on the Shop page.
// Passing no "q" (or an empty one) returns EVERY product, because searchProductsCtrl's
// where clause becomes {} (matches everything) when q is empty.
export async function searchProducts(
  params: ProductSearchParams = {},
): Promise<PaginatedResponse<Product>> {
  const qs = buildQueryString({
    q: params.q,
    page: params.page,
    limit: params.limit,
  });
  return apiRequest<PaginatedResponse<Product>>(`/products/search${qs}`, {
    method: "GET",
  });
}

// ---- GET /api/v1/products/:id ----
// Public — no login required, matches the standalone route with no .all() guard.
export async function getProductById(id: ID): Promise<Product> {
  return apiRequest<Product>(`/products/${id}`, {
    method: "GET",
  });
}

// ---- GET /api/v1/products ----
// 🚩 ADMIN ONLY — do NOT call this from public Shop pages!
// Only our future Admin Panel should use this one.
export async function listProducts(
  params: ProductQueryParams = {},
): Promise<PaginatedResponse<Product>> {
  const qs = buildQueryString({ page: params.page, limit: params.limit });
  return apiRequest<PaginatedResponse<Product>>(`/products${qs}`, {
    method: "GET",
  });
}

// ---- POST /api/v1/products ---- (ADMIN ONLY)
export async function createProduct(input: ProductFormInput): Promise<Product> {
  const formData = buildProductFormData(input);
  return apiRequest<Product>("/products", {
    method: "POST",
    body: formData, // apiFetch (Part 3-A) automatically skips setting Content-Type for FormData
  });
}

// ---- PUT /api/v1/products/:id ---- (ADMIN ONLY)
export async function updateProduct(
  id: ID,
  input: Partial<ProductFormInput>,
): Promise<Product> {
  const formData = buildProductFormData(input);
  return apiRequest<Product>(`/products/${id}`, {
    method: "PUT",
    body: formData,
  });
}

// ---- DELETE /api/v1/products/:id ---- (ADMIN ONLY)
export async function deleteProduct(id: ID): Promise<DeleteProductResponse> {
  return apiRequest<DeleteProductResponse>(`/products/${id}`, {
    method: "DELETE",
  });
}
