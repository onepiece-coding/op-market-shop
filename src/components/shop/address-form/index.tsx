/**
 * @file frontend/src/components/shop/address-form/index.tsx
 */

import { invalidateExact } from "@/cache/invalidate";
import { useState, type FormEvent } from "react";
import { Input, Button } from "@/components/ui";
import type { Address } from "@/types/address";
import { useMutate } from "@/hooks/useMutate";
import { cacheKeys } from "@/cache/cacheKeys";
import { addAddress } from "@/api/users";
import { useToast } from "@/hooks";

import styles from "./styles.module.css";

export interface AddressFormProps {
  onAdded: (address: Address) => void;
  onCancel: () => void;
}

export function AddressForm({ onAdded, onCancel }: AddressFormProps) {
  const { showToast } = useToast();

  const [lineOne, setLineOne] = useState("");
  const [lineTwo, setLineTwo] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [pincode, setPincode] = useState("");
  const [submitError, setSubmitError] = useState<unknown>(null);

  const { mutate, isLoading } = useMutate(addAddress, {
    onSuccess: (newAddress, _variables, store) => {
      // STRATEGY 1 from Part 4-C: exact-key removal. The Checkout page's
      // address list shares this SAME key, so it updates automatically.
      invalidateExact(store, cacheKeys.users.addresses());
      showToast("Address added.", "success");
      onAdded(newAddress);
    },
    onError: (error) => {
      setSubmitError(error);
    },
  });

  function validate(): string | null {
    if (!lineOne.trim()) return "Address line 1 is required.";
    if (!city.trim()) return "City is required.";
    if (!country.trim()) return "Country is required.";
    // 🚩 mirrors addressSchema's REAL backend rule exactly: pincode must
    // be EXACTLY 5 characters — not "at least 5", not "5 or more"
    if (pincode.trim().length !== 5)
      return "Postal code must be exactly 5 characters.";
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    const validationMessage = validate();
    if (validationMessage) {
      setSubmitError(new Error(validationMessage));
      return;
    }

    try {
      await mutate({
        lineOne: lineOne.trim(),
        // 🚩 THE FIX from our "why" section: we send undefined (by
        // simply not providing a real value), NEVER null, when empty.
        // JSON.stringify (inside apiFetch, Part 3-A) automatically drops
        // any key whose value is undefined — so this field is genuinely
        // ABSENT from the real network request, matching what
        // addressSchema's z.string().optional() actually expects.
        lineTwo: lineTwo.trim() || undefined,
        city: city.trim(),
        country: country.trim(),
        pincode: pincode.trim(),
      });
    } catch {
      // error is already captured via onError above — this just stops
      // the rejection from becoming an unhandled promise warning
    }
  }

  const generalError =
    submitError instanceof Error
      ? submitError.message
      : submitError
        ? "Something went wrong. Please try again."
        : null;

  return (
    <form onSubmit={handleSubmit} noValidate className={styles.form}>
      {generalError && (
        <div role="alert" className={styles.banner}>
          {generalError}
        </div>
      )}

      <Input
        label="Address line 1"
        value={lineOne}
        onChange={(e) => setLineOne(e.target.value)}
      />
      <Input
        label="Address line 2 (optional)"
        value={lineTwo}
        onChange={(e) => setLineTwo(e.target.value)}
      />
      <Input
        label="City"
        value={city}
        onChange={(e) => setCity(e.target.value)}
      />
      <Input
        label="Country"
        value={country}
        onChange={(e) => setCountry(e.target.value)}
      />
      <Input
        label="Postal code"
        value={pincode}
        onChange={(e) => setPincode(e.target.value)}
        helperText="Must be exactly 5 characters"
      />

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          Save address
        </Button>
      </div>
    </form>
  );
}
