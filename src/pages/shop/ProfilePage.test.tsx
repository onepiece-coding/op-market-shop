/**
 * @file frontend/src/pages/shop/ProfilePage.test.tsx
 */

import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ProfilePage } from "./ProfilePage";
import { CacheProvider } from "@/cache";

import userEvent from "@testing-library/user-event";

vi.mock("@/api/users", () => ({
  listAddresses: vi.fn(),
  addAddress: vi.fn(),
  deleteAddress: vi.fn(),
}));
vi.mock("@/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks")>();
  return { ...actual, useAuth: vi.fn(), useToast: vi.fn() };
});

import { listAddresses, deleteAddress } from "@/api/users";
import { useAuth, useToast } from "@/hooks";

const showToastMock = vi.fn();
const updateProfileMock = vi.fn();

function makeAddress(id: number, line: string) {
  return {
    id,
    lineOne: line,
    lineTwo: null,
    city: "Rabat",
    country: "MA",
    pincode: "10000",
    userId: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    formattedAddress: `${line}, Rabat, MA-10000`,
  };
}

function renderPage(userOverrides = {}) {
  (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
    user: {
      id: 1,
      name: "Lahcen",
      email: "lahcen@test.com",
      role: "USER",
      defaultShippingAddress: null,
      defaultBillingAddress: null,
      ...userOverrides,
    },
    updateProfile: updateProfileMock,
  });
  return render(
    <MemoryRouter>
      <CacheProvider>
        <ProfilePage />
      </CacheProvider>
    </MemoryRouter>,
  );
}

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useToast as ReturnType<typeof vi.fn>).mockReturnValue({
      showToast: showToastMock,
    });
  });

  it("shows the user's read-only email and role", async () => {
    (listAddresses as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderPage();

    expect(screen.getByText("lahcen@test.com")).toBeInTheDocument();
    expect(screen.getByText("User")).toBeInTheDocument();
  });

  it("prefills the name field and disables Save when unchanged", async () => {
    (listAddresses as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderPage();

    expect(screen.getByLabelText("Name")).toHaveValue("Lahcen");
    expect(screen.getByRole("button", { name: "Save name" })).toBeDisabled();
  });

  it("enables Save once the name is edited, and calls updateProfile with the new name", async () => {
    const user = userEvent.setup();
    updateProfileMock.mockResolvedValue({ id: 1, name: "New Name" });
    (listAddresses as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderPage();

    const nameInput = screen.getByLabelText("Name");
    await user.clear(nameInput);
    await user.type(nameInput, "New Name");

    expect(
      screen.getByRole("button", { name: "Save name" }),
    ).not.toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Save name" }));

    await waitFor(() =>
      expect(updateProfileMock).toHaveBeenCalledWith({ name: "New Name" }),
    );
    expect(showToastMock).toHaveBeenCalledWith("Name updated.", "success");
  });

  it("shows an empty-state message when there are no saved addresses", async () => {
    (listAddresses as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderPage();

    expect(
      await screen.findByText("You don't have any saved addresses yet."),
    ).toBeInTheDocument();
  });

  it("shows both radio checked correctly, matching the user's existing defaults", async () => {
    (listAddresses as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeAddress(1, "1 First St"),
      makeAddress(2, "2 Second St"),
    ]);
    renderPage({ defaultShippingAddress: 1, defaultBillingAddress: 2 });

    await screen.findByText("1 First St, Rabat, MA-10000");

    expect(
      screen.getByLabelText(
        "Set 1 First St, Rabat, MA-10000 as default shipping address",
      ),
    ).toBeChecked();
    expect(
      screen.getByLabelText(
        "Set 2 Second St, Rabat, MA-10000 as default billing address",
      ),
    ).toBeChecked();
    // proves these are genuinely INDEPENDENT — address 1 is shipping
    // default but NOT billing default
    expect(
      screen.getByLabelText(
        "Set 1 First St, Rabat, MA-10000 as default billing address",
      ),
    ).not.toBeChecked();
  });

  it("selecting a shipping radio calls updateProfile with defaultShippingAddress", async () => {
    const user = userEvent.setup();
    updateProfileMock.mockResolvedValue({ id: 1, defaultShippingAddress: 2 });
    (listAddresses as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeAddress(2, "2 Second St"),
    ]);
    renderPage();

    await screen.findByText("2 Second St, Rabat, MA-10000");

    await user.click(
      screen.getByLabelText(
        "Set 2 Second St, Rabat, MA-10000 as default shipping address",
      ),
    );

    await waitFor(() =>
      expect(updateProfileMock).toHaveBeenCalledWith({
        defaultShippingAddress: 2,
      }),
    );
  });

  it("warns in the confirm dialog when deleting an address that IS a current default", async () => {
    const user = userEvent.setup();
    (listAddresses as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeAddress(1, "1 First St"),
    ]);
    renderPage({ defaultShippingAddress: 1 });

    await screen.findByText("1 First St, Rabat, MA-10000");

    await user.click(
      screen.getByLabelText("Delete address: 1 First St, Rabat, MA-10000"),
    );

    expect(
      screen.getByText(/This is currently your default shipping address\./),
    ).toBeInTheDocument();
  });

  it("does NOT show a default warning when deleting a non-default address", async () => {
    const user = userEvent.setup();
    (listAddresses as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeAddress(1, "1 First St"),
    ]);
    renderPage({ defaultShippingAddress: null, defaultBillingAddress: null });

    await screen.findByText("1 First St, Rabat, MA-10000");

    await user.click(
      screen.getByLabelText("Delete address: 1 First St, Rabat, MA-10000"),
    );

    expect(
      screen.queryByText(/currently your default/),
    ).not.toBeInTheDocument();
  });

  it("confirming delete calls deleteAddress with the correct id", async () => {
    const user = userEvent.setup();
    (listAddresses as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeAddress(1, "1 First St"),
    ]);
    (deleteAddress as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: true,
      message: "Address deleted successfully",
    });
    renderPage();

    await screen.findByText("1 First St, Rabat, MA-10000");
    await user.click(
      screen.getByLabelText("Delete address: 1 First St, Rabat, MA-10000"),
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(deleteAddress).toHaveBeenCalledWith(1));
    expect(showToastMock).toHaveBeenCalledWith("Address deleted.", "success");
  });

  it("opens the Add Address modal", async () => {
    const user = userEvent.setup();
    (listAddresses as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    renderPage();
    await screen.findByText("You don't have any saved addresses yet.");

    await user.click(screen.getByRole("button", { name: "+ Add address" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Address line 1")).toBeInTheDocument();
  });
});
