/**
 * @file frontend/src/components/ui/confirm-dialog/index.tsx
 */

import { Button, Modal } from "@/components/ui";

import styles from "./styles.module.css";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  isLoading?: boolean;
  variant?: "danger" | "primary";
}

// A small reusable wrapper around Modal (Part 7-B) for the "are you
// sure?" pattern — used here for deleting a product, and again in Part
// 9-C/9-D for canceling orders and changing user roles.
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  isLoading = false,
  variant = "danger",
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant={variant} onClick={onConfirm} isLoading={isLoading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className={styles.message}>{message}</p>
    </Modal>
  );
}
