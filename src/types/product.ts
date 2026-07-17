/**
 * @file frontend/src/types/product.ts
 */

import type { DecimalString, ID, ISODateString } from "./common";

export interface Product {
  id: ID;
  name: string;
  description: string;
  // Price is a Decimal(10,2) in Prisma → arrives as a STRING like "49.99".
  // Never do math on this directly — always convert with Number(product.price) first.
  price: DecimalString;
  // 🚩 IMPORTANT: Look closely at schema.prisma — "tags String" is a SINGLE
  // string column, not an array! The backend joins tags with commas before
  // saving (e.g. tagsArray.join(",")), so what we receive back is literally
  // one string like "electronics,phone,sale" — NOT a JavaScript array.
  // We must split it ourselves: product.tags.split(",") when we want a list.
  tags: string;
  imageUrl: string | null; // Cloudinary's public image URL, or null if no image was uploaded
  imageKey: string | null; // Cloudinary's internal id (only useful for admin delete/replace logic)
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// What the ADMIN form sends when creating/editing a product.
// Note: price and tags are typed as "number" and "string[]" here — the NORMAL,
// friendly shapes a human fills into a form. We will convert them into the
// backend's expected format (FormData with a comma string) inside our API layer,
// which we'll build in Part 3. This keeps our UI code simple and human-friendly.
export interface ProductFormInput {
  name: string;
  description: string;
  price: number; // a normal number while the admin is typing, e.g. 49.99
  tags: string[]; // a normal array while the admin is typing, e.g. ["electronics", "sale"]
  image?: File; // the actual image file object chosen from the computer, if any
}

// 🚩 Gotcha B: deleteProductCtrl uses "status", NOT "success"!
export interface DeleteProductResponse {
  status: true;
  message: string;
}

// The optional filters listProductsCtrl accepts (page, limit).
export interface ProductQueryParams {
  page?: number;
  limit?: number;
}

// searchProductsCtrl accepts everything listProductsCtrl does, PLUS "q" (the search text).
// "extends" means "ProductSearchParams has all the fields of ProductQueryParams, plus more".
export interface ProductSearchParams extends ProductQueryParams {
  q?: string;
}
