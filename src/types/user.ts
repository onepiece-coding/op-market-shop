/**
 * @file frontend/src/types/user.ts
 */

import type { ID, ISODateString } from "./common";
import type { Address } from "./address";

// This matches the "Role" enum in schema.prisma exactly.
// A "union type" (the | symbol) means "this value can ONLY ever be one of these two exact strings".
// If you ever try to assign role = "MANAGER", TypeScript will immediately error.
export type Role = "ADMIN" | "USER";

// This matches EXACTLY what "publicUserSelect" in the backend sends back —
// no more, no less. Notice there is NO "password" field here — the backend
// never sends it, so we don't even give TypeScript the option to expect it.
export interface PublicUser {
  id: ID; // the user's unique database id
  name: string; // the user's display name
  email: string; // the user's login email
  role: Role; // either "ADMIN" or "USER"
  // emailVerifiedAt is DateTime? in Prisma (the "?" means "nullable").
  // Nullable DateTime fields become "string OR null" on the frontend —
  // null means "this user has not verified their email yet".
  emailVerifiedAt: ISODateString | null;
  // Int? in Prisma (nullable number) becomes "number OR null" here.
  // null means "the user has not picked a default shipping address yet".
  defaultShippingAddress: ID | null;
  defaultBillingAddress: ID | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// getUserByIdCtrl's response — the ONLY endpoint that returns a user
// WITH their addresses attached (via select: { ...publicUserSelect, addresses: true }).
// "&" here means "combine both shapes into one" — take everything from PublicUser,
// AND add this addresses field on top of it.
export type UserWithAddresses = PublicUser & {
  addresses: Address[];
};

// matches updateUserSchema exactly — every field optional, since a user might
// only be changing their name, or only their default shipping address, etc.
export interface UpdateUserInput {
  name?: string;
  defaultShippingAddress?: number;
  defaultBillingAddress?: number;
}

// the query params accepted by listUsersCtrl (admin only)
export interface UserQueryParams {
  page?: number;
  limit?: number;
}

// matches changeUserRoleSchema exactly — role must be "ADMIN" or "USER"
export interface ChangeUserRoleInput {
  role: Role;
}
