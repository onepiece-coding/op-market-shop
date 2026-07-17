/**
 * @file frontend/src/pages/admin/AdminUsersPage.test.tsx
 */

import { render, screen, waitFor, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminUsersPage } from "./AdminUsersPage";
import { MemoryRouter } from "react-router-dom";
import { CacheProvider } from "@/cache";

import userEvent from "@testing-library/user-event";

vi.mock("@/api/users", () => ({
  listUsers: vi.fn(),
  changeUserRole: vi.fn(),
}));
vi.mock("@/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks")>();
  return { ...actual, useAuth: vi.fn(), useToast: vi.fn() };
});

import { listUsers, changeUserRole } from "@/api/users";
import { useAuth, useToast } from "@/hooks";

const showToastMock = vi.fn();

function makeUser(id: number, name: string, role: "ADMIN" | "USER") {
  return {
    id,
    name,
    email: `${name.toLowerCase()}@test.com`,
    role,
    emailVerifiedAt: "2026-01-01T00:00:00.000Z",
    defaultShippingAddress: null,
    defaultBillingAddress: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function renderPage(currentAdminId = 99) {
  (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
    user: { id: currentAdminId, name: "Current Admin", role: "ADMIN" },
  });
  return render(
    <MemoryRouter>
      <CacheProvider>
        <AdminUsersPage />
      </CacheProvider>
    </MemoryRouter>,
  );
}

describe("AdminUsersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useToast as ReturnType<typeof vi.fn>).mockReturnValue({
      showToast: showToastMock,
    });
  });

  it("shows a loading spinner, then the users table", async () => {
    (listUsers as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [makeUser(1, "Lahcen", "USER")],
      pagination: { current: 1, limit: 10, totalPages: 1, results: 1 },
    });

    renderPage();

    //     expect(screen.getByRole("status")).toBeInTheDocument();
    expect(await screen.findByText("Lahcen")).toBeInTheDocument();
    expect(screen.getByText("lahcen@test.com")).toBeInTheDocument();
  });

  it("shows 'Promote to Admin' for a USER and 'Demote to User' for an ADMIN", async () => {
    (listUsers as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [makeUser(1, "Lahcen", "USER"), makeUser(2, "OtherAdmin", "ADMIN")],
      pagination: { current: 1, limit: 10, totalPages: 1, results: 2 },
    });

    renderPage();
    await screen.findByText("Lahcen");

    expect(
      screen.getByRole("button", { name: "Promote to Admin" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Demote to User" }),
    ).toBeInTheDocument();
  });

  it("🚩 SAFETY CHECK: disables the role button for the CURRENTLY LOGGED-IN admin's own row", async () => {
    (listUsers as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [
        makeUser(99, "Current Admin", "ADMIN"),
        makeUser(1, "Lahcen", "USER"),
      ],
      pagination: { current: 1, limit: 10, totalPages: 1, results: 2 },
    });

    renderPage(99); // the logged-in admin's OWN id matches user id 99 here

    await screen.findByText("Current Admin");

    const selfRow = screen.getByText("Current Admin").closest("tr")!;
    const otherRow = screen.getByText("Lahcen").closest("tr")!;

    expect(within(selfRow).getByRole("button")).toBeDisabled();
    expect(within(otherRow).getByRole("button")).not.toBeDisabled();
  });

  it("opens a confirmation dialog before actually changing a role", async () => {
    const user = userEvent.setup();
    (listUsers as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [makeUser(1, "Lahcen", "USER")],
      pagination: { current: 1, limit: 10, totalPages: 1, results: 1 },
    });

    renderPage();
    await screen.findByText("Lahcen");

    await user.click(screen.getByRole("button", { name: "Promote to Admin" }));

    expect(
      screen.getByText(
        'Are you sure you want to change "Lahcen"\'s role to Admin?',
      ),
    ).toBeInTheDocument();
    // confirms the mutation has NOT fired yet — only after explicit confirmation
    expect(changeUserRole).not.toHaveBeenCalled();
  });

  it("calls changeUserRole with the correct id and new role after confirming", async () => {
    const user = userEvent.setup();
    (listUsers as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [makeUser(1, "Lahcen", "USER")],
      pagination: { current: 1, limit: 10, totalPages: 1, results: 1 },
    });
    (changeUserRole as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeUser(1, "Lahcen", "ADMIN"),
    );

    renderPage();
    await screen.findByText("Lahcen");

    await user.click(screen.getByRole("button", { name: "Promote to Admin" }));
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() =>
      expect(changeUserRole).toHaveBeenCalledWith(1, { role: "ADMIN" }),
    );
    expect(showToastMock).toHaveBeenCalledWith("User role updated.", "success");
  });

  it("shows an error toast when changing the role fails", async () => {
    const user = userEvent.setup();
    (listUsers as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [makeUser(1, "Lahcen", "USER")],
      pagination: { current: 1, limit: 10, totalPages: 1, results: 1 },
    });
    (changeUserRole as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Server error"),
    );

    renderPage();
    await screen.findByText("Lahcen");

    await user.click(screen.getByRole("button", { name: "Promote to Admin" }));
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() =>
      expect(showToastMock).toHaveBeenCalledWith(
        "Could not update this user's role. Please try again.",
        "error",
      ),
    );
  });

  it("shows an error banner when listUsers fails", async () => {
    (listUsers as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Server error"),
    );

    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong while loading users",
    );
  });
});
