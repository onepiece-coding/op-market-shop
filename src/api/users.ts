/**
 * @file frontend/src/api/users.ts
 */

import { apiRequest } from "./apiRequest";
import { buildQueryString } from "@/utils/queryString";
import type {
  PublicUser,
  UpdateUserInput,
  UserQueryParams,
  ChangeUserRoleInput,
  UserWithAddresses,
} from "@/types/user";
import type {
  Address,
  NewAddressInput,
  DeleteAddressResponse,
} from "@/types/address";
import type { PaginatedResponse } from "@/types/api";
import type { ID } from "@/types/common";

// ---- POST /api/v1/users/address ----
export async function addAddress(input: NewAddressInput): Promise<Address> {
  return apiRequest<Address>("/users/address", {
    method: "POST",
    body: input,
  });
}

// ---- GET /api/v1/users/address ----
// Every address belonging to the CURRENTLY LOGGED-IN user (there's no way
// to fetch someone else's addresses through this endpoint — the controller
// always filters by "req.user!.id").
export async function listAddresses(): Promise<Address[]> {
  return apiRequest<Address[]>("/users/address", {
    method: "GET",
  });
}

// ---- DELETE /api/v1/users/address/:id ----
export async function deleteAddress(id: ID): Promise<DeleteAddressResponse> {
  return apiRequest<DeleteAddressResponse>(`/users/address/${id}`, {
    method: "DELETE",
  });
}

// ---- PUT /api/v1/users ----
// Updates the CURRENTLY LOGGED-IN user's own name and/or default addresses.
// Notice there's no "id" parameter at all — the backend always uses "req.user!.id",
// so there's no way (and no need) to update anyone else's profile through this.
export async function updateUser(input: UpdateUserInput): Promise<PublicUser> {
  return apiRequest<PublicUser>("/users", {
    method: "PUT",
    body: input,
  });
}

// ---- GET /api/v1/users ---- (ADMIN ONLY)
export async function listUsers(
  params: UserQueryParams = {},
): Promise<PaginatedResponse<PublicUser>> {
  const qs = buildQueryString({ page: params.page, limit: params.limit });
  return apiRequest<PaginatedResponse<PublicUser>>(`/users${qs}`, {
    method: "GET",
  });
}

// ---- GET /api/v1/users/:id ---- (ADMIN ONLY)
// The ONLY endpoint that returns a user together with their addresses attached.
export async function getUserById(id: ID): Promise<UserWithAddresses> {
  return apiRequest<UserWithAddresses>(`/users/${id}`, {
    method: "GET",
  });
}

// ---- PUT /api/v1/users/:id/role ---- (ADMIN ONLY)
export async function changeUserRole(
  id: ID,
  input: ChangeUserRoleInput,
): Promise<PublicUser> {
  return apiRequest<PublicUser>(`/users/${id}/role`, {
    method: "PUT",
    body: input,
  });
}
