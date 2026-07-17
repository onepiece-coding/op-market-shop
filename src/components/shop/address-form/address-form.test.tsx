/**
 * @file frontend/src/components/shop/address-form/address-form.test.tsx
 */

import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AddressForm } from ".";

import userEvent from "@testing-library/user-event";

vi.mock("@/api/users", () => ({
  addAddress: vi.fn(),
}));
vi.mock("@/cache", async () => {
  const actual = await vi.importActual<typeof import("@/cache")>("@/cache");
  return actual;
});
vi.mock("@/hooks", () => ({
  useToast: vi.fn(),
}));

import { addAddress } from "@/api/users";
import { CacheProvider } from "@/cache";
import { useToast } from "@/hooks";

const showToastMock = vi.fn();

function renderForm(onAdded = vi.fn(), onCancel = vi.fn()) {
  return render(
    <CacheProvider>
      <AddressForm onAdded={onAdded} onCancel={onCancel} />
    </CacheProvider>,
  );
}

describe("AddressForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useToast as ReturnType<typeof vi.fn>).mockReturnValue({
      showToast: showToastMock,
    });
  });

  it("renders all expected fields", () => {
    renderForm();

    expect(screen.getByLabelText("Address line 1")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Address line 2 (optional)"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("City")).toBeInTheDocument();
    expect(screen.getByLabelText("Country")).toBeInTheDocument();
    expect(screen.getByLabelText("Postal code")).toBeInTheDocument();
  });

  it("shows a validation error and does not call addAddress when required fields are empty", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: "Save address" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Address line 1 is required.",
    );
    expect(addAddress).not.toHaveBeenCalled();
  });

  it("shows a validation error when the postal code is NOT exactly 5 characters (mirrors the real backend rule)", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText("Address line 1"), "1 Main St");
    await user.type(screen.getByLabelText("City"), "Rabat");
    await user.type(screen.getByLabelText("Country"), "MA");
    await user.type(screen.getByLabelText("Postal code"), "123"); // too short

    await user.click(screen.getByRole("button", { name: "Save address" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Postal code must be exactly 5 characters.",
    );
    expect(addAddress).not.toHaveBeenCalled();
  });

  it("sends lineTwo as undefined when left empty — matches addressSchema exactly (NOT null)", async () => {
    const user = userEvent.setup();
    (addAddress as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      lineOne: "1 Main St",
      lineTwo: null,
      city: "Rabat",
      country: "MA",
      pincode: "10000",
      userId: 1,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      formattedAddress: "1 Main St, Rabat, MA-10000",
    });

    renderForm();

    await user.type(screen.getByLabelText("Address line 1"), "1 Main St");
    await user.type(screen.getByLabelText("City"), "Rabat");
    await user.type(screen.getByLabelText("Country"), "MA");
    await user.type(screen.getByLabelText("Postal code"), "10000");
    // deliberately leave "Address line 2" empty

    await user.click(screen.getByRole("button", { name: "Save address" }));

    await waitFor(() => expect(addAddress).toHaveBeenCalled());

    const sentPayload = (addAddress as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(sentPayload.lineTwo).toBeUndefined();
  });

  it("calls onAdded with the created address on success", async () => {
    const user = userEvent.setup();
    const onAdded = vi.fn();
    const createdAddress = {
      id: 1,
      lineOne: "1 Main St",
      lineTwo: null,
      city: "Rabat",
      country: "MA",
      pincode: "10000",
      userId: 1,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      formattedAddress: "1 Main St, Rabat, MA-10000",
    };
    (addAddress as ReturnType<typeof vi.fn>).mockResolvedValue(createdAddress);

    renderForm(onAdded);

    await user.type(screen.getByLabelText("Address line 1"), "1 Main St");
    await user.type(screen.getByLabelText("City"), "Rabat");
    await user.type(screen.getByLabelText("Country"), "MA");
    await user.type(screen.getByLabelText("Postal code"), "10000");

    await user.click(screen.getByRole("button", { name: "Save address" }));

    await waitFor(() => expect(onAdded).toHaveBeenCalledWith(createdAddress));
  });

  it("shows a general error banner when addAddress fails", async () => {
    const user = userEvent.setup();
    (addAddress as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Server error"),
    );

    renderForm();

    await user.type(screen.getByLabelText("Address line 1"), "1 Main St");
    await user.type(screen.getByLabelText("City"), "Rabat");
    await user.type(screen.getByLabelText("Country"), "MA");
    await user.type(screen.getByLabelText("Postal code"), "10000");

    await user.click(screen.getByRole("button", { name: "Save address" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Server error");
  });

  it("calls onCancel when the Cancel button is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    renderForm(vi.fn(), onCancel);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
