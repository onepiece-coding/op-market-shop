/**
 * @file frontend/src/pages/shop/ProfilePage.tsx
 */

import { ConfirmDialog, Modal, Button, Spinner, Input } from "@/components/ui";
import { useFetch, useAuth, useToast, useMutate, usePageMeta } from "@/hooks";
import { listAddresses, deleteAddress } from "@/api/users";
import { AddressForm, RoleBadge } from "@/components/shop";
import { cacheKeys, invalidateExact } from "@/cache";
import type { Address } from "@/types/address";
import { useState } from "react";

import styles from "./ProfilePage.module.css";

export function ProfilePage() {
  usePageMeta({ title: "My profile", noIndex: true });

  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name ?? "");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);

  const {
    data: addresses,
    isLoading,
    error,
  } = useFetch(cacheKeys.users.addresses(), listAddresses);

  const { mutate: saveName, isLoading: isSavingName } = useMutate(
    (newName: string) => updateProfile({ name: newName }),
    {
      onSuccess: () => showToast("Name updated.", "success"),
      onError: () =>
        showToast("Could not update your name. Please try again.", "error"),
    },
  );

  const { mutate: setDefaultShipping, isLoading: isSettingShipping } =
    useMutate(
      (addressId: number) =>
        updateProfile({ defaultShippingAddress: addressId }),
      {
        onSuccess: () =>
          showToast("Default shipping address updated.", "success"),
        onError: () =>
          showToast("Could not update your default shipping address.", "error"),
      },
    );

  const { mutate: setDefaultBilling, isLoading: isSettingBilling } = useMutate(
    (addressId: number) => updateProfile({ defaultBillingAddress: addressId }),
    {
      onSuccess: () => showToast("Default billing address updated.", "success"),
      onError: () =>
        showToast("Could not update your default billing address.", "error"),
    },
  );

  const { mutate: removeAddress, isLoading: isDeleting } = useMutate(
    deleteAddress,
    {
      onSuccess: (_data, _variables, store) => {
        invalidateExact(store, cacheKeys.users.addresses());
        showToast("Address deleted.", "success");
        setAddressToDelete(null);
      },
      onError: () => {
        showToast("Could not delete this address. Please try again.", "error");
      },
    },
  );

  const isNameUnchanged = name.trim() === (user?.name ?? "");

  if (!user) return null; // ProfilePage only ever renders inside ProtectedRoute

  return (
    <div className={styles.page}>
      <h1>My profile</h1>

      <section className={styles.section}>
        <h2>Account</h2>
        <div className={styles.accountRow}>
          <span className={styles.readonlyLabel}>Email</span>
          <span className={styles.readonlyValue}>{user.email}</span>
        </div>
        <div className={styles.accountRow}>
          <span className={styles.readonlyLabel}>Account type</span>
          <RoleBadge role={user.role} />
        </div>

        <form
          className={styles.nameForm}
          onSubmit={(event) => {
            event.preventDefault();
            saveName(name.trim());
          }}
        >
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button
            type="submit"
            isLoading={isSavingName}
            disabled={isNameUnchanged || !name.trim()}
          >
            Save name
          </Button>
        </form>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Saved addresses</h2>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
          >
            + Add address
          </Button>
        </div>

        {isLoading && (
          <div className={styles.centered}>
            <Spinner label="Loading addresses" />
          </div>
        )}

        {error && (
          <div role="alert" className={styles.errorBanner}>
            Something went wrong while loading your addresses. Please try again.
          </div>
        )}

        {!isLoading && !error && (!addresses || addresses.length === 0) && (
          <p className={styles.emptyState}>
            You don&apos;t have any saved addresses yet.
          </p>
        )}

        {!isLoading && addresses && addresses.length > 0 && (
          <div className={styles.addressTable}>
            <div className={styles.addressTableHeader}>
              <span>Address</span>
              <span role="none">Default shipping</span>
              <span role="none">Default billing</span>
              <span aria-hidden="true" />
            </div>

            {addresses.map((address) => (
              <div key={address.id} className={styles.addressRow}>
                <span className={styles.addressText}>
                  {address.formattedAddress}
                </span>

                <label className={styles.radioCell}>
                  <input
                    type="radio"
                    name="defaultShipping"
                    aria-label={`Set ${address.formattedAddress} as default shipping address`}
                    checked={user.defaultShippingAddress === address.id}
                    disabled={isSettingShipping}
                    onChange={() => setDefaultShipping(address.id)}
                  />
                  {/* NEW: only visible below the mobile breakpoint (see CSS) —
                      on desktop, the column header already gives this context,
                      so showing both would be redundant. */}
                  <span className={styles.radioInlineLabel}>
                    Default shipping
                  </span>
                </label>

                <label className={styles.radioCell}>
                  <input
                    type="radio"
                    name="defaultBilling"
                    aria-label={`Set ${address.formattedAddress} as default billing address`}
                    checked={user.defaultBillingAddress === address.id}
                    disabled={isSettingBilling}
                    onChange={() => setDefaultBilling(address.id)}
                  />
                  <span className={styles.radioInlineLabel}>
                    Default billing
                  </span>
                </label>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAddressToDelete(address)}
                  aria-label={`Delete address: ${address.formattedAddress}`}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add a new address"
      >
        <AddressForm
          onAdded={() => setIsAddModalOpen(false)}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={addressToDelete !== null}
        onClose={() => setAddressToDelete(null)}
        onConfirm={() => {
          if (addressToDelete) removeAddress(addressToDelete.id);
        }}
        title="Delete address?"
        message={
          addressToDelete
            ? [
                `Are you sure you want to delete "${addressToDelete.formattedAddress}"?`,
                // 🚩 the honest warning from our "why" section — since the
                // backend never clears a stale default reference on its own
                addressToDelete.id === user.defaultShippingAddress
                  ? " This is currently your default shipping address."
                  : "",
                addressToDelete.id === user.defaultBillingAddress
                  ? " This is currently your default billing address."
                  : "",
              ].join("")
            : ""
        }
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
