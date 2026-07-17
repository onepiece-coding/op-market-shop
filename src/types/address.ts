/**
 * @file frontend/src/types/address.ts
 */

import type { ID, ISODateString } from "./common";

// This matches the "Address" model in schema.prisma.
export interface Address {
  id: ID;
  lineOne: string;
  // lineTwo is String? in Prisma (optional apartment/suite line) — nullable.
  lineTwo: string | null;
  city: string;
  country: string;
  pincode: string;
  userId: ID; // which user this address belongs to
  createdAt: ISODateString;
  updatedAt: ISODateString;
  // 🚩 GOTCHA #3: This field does NOT exist in schema.prisma at all!
  // It's added automatically by a Prisma "client extension" in db/prisma.ts,
  // which computes a ready-to-display address string (e.g. "12 Main St, Casablanca, MA-20000")
  // on every address read that goes through that specific prismaClient instance.
  // Both /users/address endpoints (add + list) use that exact client, so this
  // field WILL be present in their responses — we should use it directly instead
  // of re-building the same formatting logic ourselves on the frontend!
  formattedAddress: string;
}

// deleteAddressCtrl's response — SAME shape as DeleteProductResponse (uses "status"),
// but we still write a separate named type. Why not just reuse DeleteProductResponse?
// Because these two endpoints are UNRELATED in the real world (deleting a product
// vs. deleting an address) — they only happen to share a shape TODAY. If Mohamed
// changes one later, we don't want a change to "delete address" accidentally
// breaking our product-delete code just because they secretly shared a type.
export interface DeleteAddressResponse {
  status: true;
  message: string;
}

// 🚩 THE GOTCHA explained above: Address.lineTwo (as READ from the
// database) is "string | null". But addressSchema's CREATE rule is
// "z.string().optional()" — it accepts a MISSING field (undefined),
// never an explicit null. Our original Omit-based type accidentally
// inherited the READ shape for this one field. We fix it by excluding
// "lineTwo" from the Omit and re-adding it with the CORRECT, narrower
// shape that actually matches what the backend will accept.
export type NewAddressInput = Omit<
  Address,
  "id" | "userId" | "createdAt" | "updatedAt" | "formattedAddress" | "lineTwo"
> & {
  lineTwo?: string;
};
