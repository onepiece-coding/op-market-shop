/**
 * @file frontend/src/api/users.test.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  addAddress,
  listAddresses,
  deleteAddress,
  updateUser,
  listUsers,
  getUserById,
  changeUserRole,
} from "./users";

function createFakeResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify(body),
  };
}

describe("users API functions", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("addAddress sends a POST to /users/address with the address fields", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      createFakeResponse({
        id: 1,
        lineOne: "12 Main St",
        lineTwo: null,
        city: "Rabat",
        country: "MA",
        pincode: "10000",
        userId: 5,
        formattedAddress: "12 Main St, Rabat, MA-10000",
      }),
    );

    const result = await addAddress({
      lineOne: "12 Main St",
      city: "Rabat",
      country: "MA",
      pincode: "10000",
      lineTwo: undefined,
    });

    const [urlUsed, optionsUsed] = fetchMock.mock.calls[0];
    expect(urlUsed).toContain("/users/address");
    expect(optionsUsed.method).toBe("POST");
    // confirm the computed field really does come through in the result
    expect(result.formattedAddress).toBe("12 Main St, Rabat, MA-10000");
  });

  it("listAddresses sends a GET to /users/address and returns an array", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      createFakeResponse([{ id: 1, city: "Rabat" }]),
    );

    const result = await listAddresses();

    const [urlUsed, optionsUsed] = fetchMock.mock.calls[0];
    expect(urlUsed).toContain("/users/address");
    expect(optionsUsed.method).toBe("GET");
    expect(Array.isArray(result)).toBe(true);
  });

  it("deleteAddress sends a DELETE to /users/address/:id", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      createFakeResponse({
        status: true,
        message: "Address deleted successfully",
      }),
    );

    const result = await deleteAddress(3);

    const [urlUsed, optionsUsed] = fetchMock.mock.calls[0];
    expect(urlUsed).toContain("/users/address/3");
    expect(optionsUsed.method).toBe("DELETE");
    // 🚩 reminder: address delete uses "status", not "success" (different from cart!)
    expect(result).toEqual({
      status: true,
      message: "Address deleted successfully",
    });
  });

  it("updateUser sends a PUT to /users with no id in the url", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      createFakeResponse({ id: 5, name: "New Name" }),
    );

    await updateUser({ name: "New Name" });

    const [urlUsed, optionsUsed] = fetchMock.mock.calls[0];
    // the url should end exactly at "/users" — no id segment appended
    expect(urlUsed).toMatch(/\/users$/);
    expect(optionsUsed.method).toBe("PUT");
    expect(JSON.parse(optionsUsed.body)).toEqual({ name: "New Name" });
  });

  it("listUsers sends a GET to /users with page and limit", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      createFakeResponse({
        data: [],
        pagination: { current: 1, limit: 5, totalPages: 0, results: 0 },
      }),
    );

    await listUsers({ page: 1, limit: 5 });

    const [urlUsed] = fetchMock.mock.calls[0];
    expect(urlUsed).toMatch(/\/users\?/);
    expect(urlUsed).toContain("page=1");
  });

  it("getUserById sends a GET to /users/:id and returns a user WITH addresses", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      createFakeResponse({
        id: 7,
        name: "Someone",
        addresses: [{ id: 1, city: "Rabat" }],
      }),
    );

    const result = await getUserById(7);

    const [urlUsed] = fetchMock.mock.calls[0];
    expect(urlUsed).toContain("/users/7");
    // this is the ONLY endpoint returning "addresses" nested on a user
    expect(result.addresses).toHaveLength(1);
  });

  it("changeUserRole sends a PUT to /users/:id/role with the new role", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(
      createFakeResponse({ id: 7, role: "ADMIN" }),
    );

    const result = await changeUserRole(7, { role: "ADMIN" });

    const [urlUsed, optionsUsed] = fetchMock.mock.calls[0];
    expect(urlUsed).toContain("/users/7/role");
    expect(optionsUsed.method).toBe("PUT");
    expect(JSON.parse(optionsUsed.body)).toEqual({ role: "ADMIN" });
    expect(result.role).toBe("ADMIN");
  });
});
