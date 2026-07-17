/**
 * @file frontend/src/components/ui/modal/index.tsx
 */

import { useId, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useFocusTrap } from "@/hooks";
import { cx } from "@/utils/cx";

import styles from "./styles.module.css";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
}: ModalProps) {
  // useId guarantees this modal's heading has a UNIQUE id, even if two
  // Modal instances were ever mounted at once — this keeps aria-labelledby
  // correctly pointing at THIS modal's own title, always.
  const titleId = useId();
  // ALL the focus-trap/scroll-lock/restore-focus logic now lives in ONE
  // shared place — Modal no longer duplicates it itself.
  const dialogRef = useFocusTrap<HTMLDivElement>({
    isActive: isOpen,
    onEscape: onClose,
  });

  // We check this AFTER our hooks (never before) — React requires hooks
  // to run in the exact same order on every render, but the JSX we
  // RETURN can still be conditional.
  if (!isOpen) return null;

  return createPortal(
    <div
      data-testid="modal-overlay"
      className={styles.overlay}
      onClick={(event) => {
        // only close if the CLICK started AND ended directly on the
        // overlay itself — not if it bubbled up from something inside
        // the dialog card (e.g. a button click inside the modal)
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={styles.dialog}
        tabIndex={-1}
      >
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={styles.closeButton}
          >
            ×
          </button>
        </div>
        <div className={styles.body}>{children}</div>
        {footer && <div className={cx(styles.footer)}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
