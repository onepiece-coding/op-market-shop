/**
 * @file frontend/src/components/admin/product-form/index.tsx
 */

import type { Product, ProductFormInput } from "@/types/product";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";

import styles from "./styles.module.css";

export interface ProductFormProps {
  // when editing, we pass the FULL existing product, so we can prefill
  // every field — including converting its two Part 2-A gotcha fields
  // (price: DecimalString, tags: comma-joined string) back into the
  // friendly shapes a human actually types into a form
  initialProduct?: Product;
  onSubmit: (input: ProductFormInput) => Promise<unknown>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function ProductForm({
  initialProduct,
  onSubmit,
  onCancel,
  isSubmitting,
}: ProductFormProps) {
  const [name, setName] = useState(initialProduct?.name ?? "");
  const [description, setDescription] = useState(
    initialProduct?.description ?? "",
  );
  const [price, setPrice] = useState(
    initialProduct ? String(Number(initialProduct.price)) : "",
  );
  const [tagsInput, setTagsInput] = useState(initialProduct?.tags ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState<unknown>(null);

  function validate(): string | null {
    if (!name.trim()) return "Name is required.";
    if (!description.trim()) return "Description is required.";
    const priceNumber = Number(price);
    if (!Number.isFinite(priceNumber) || priceNumber < 0) {
      return "Price must be a valid, non-negative number.";
    }
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

    const tags = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        tags,
        image: imageFile ?? undefined,
      });
    } catch (error) {
      setSubmitError(error);
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
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <Input
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <Input
        label="Price"
        type="number"
        step="0.01"
        min="0"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />

      <Input
        label="Tags (comma separated)"
        value={tagsInput}
        onChange={(e) => setTagsInput(e.target.value)}
        helperText="e.g. electronics, audio, sale"
      />

      <div className={styles.imageField}>
        <label htmlFor="product-image" className={styles.imageLabel}>
          Image
        </label>
        {initialProduct?.imageUrl && !imageFile && (
          <img
            src={initialProduct.imageUrl}
            alt={initialProduct.name}
            className={styles.preview}
          />
        )}
        <input
          id="product-image"
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className={styles.actions}>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {initialProduct ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  );
}
