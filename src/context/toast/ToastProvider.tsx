/**
 * @file frontend/src/context/toast/ToastProvider.tsx
 */

import { useCallback, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cx } from "@/utils/cx";
import {
  DEFAULT_DURATION_MS,
  ToastVariant,
  ToastContext,
  ToastItem,
} from "./ToastContext";

import styles from "./styles.module.css";

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  // A simple, ever-increasing counter used to give every toast a UNIQUE
  // id. It lives in a ref (not useState) specifically because changing a
  // ref never triggers a re-render on its own — we don't need React to
  // "react" to this counter changing, we just need a reliable, always-
  // increasing number.
  const nextIdRef = useRef(0);

  const dismissToast = useCallback((id: number) => {
    // .filter() removes the matching toast. If the id doesn't exist
    // anymore (e.g. it already auto-dismissed), this simply does nothing
    // — which is exactly why it's SAFE to call dismissToast twice.
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (
      message: string,
      variant: ToastVariant = "info",
      durationMs = DEFAULT_DURATION_MS,
    ) => {
      const id = nextIdRef.current++;
      setToasts((current) => [...current, { id, message, variant }]);

      // auto-dismiss after "durationMs" milliseconds — calling
      // dismissToast() on an already-gone id (e.g. the user manually
      // clicked the × button first) is completely harmless, as noted above
      setTimeout(() => dismissToast(id), durationMs);
    },
    [dismissToast],
  );

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      {createPortal(
        <div className={styles.container}>
          {toasts.map((toast) => (
            <div
              key={toast.id}
              // "error" toasts interrupt the user IMMEDIATELY (assertive);
              // everything else waits politely for a natural pause
              role={toast.variant === "error" ? "alert" : "status"}
              className={cx(styles.toast, styles[toast.variant])}
            >
              <span>{toast.message}</span>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className={styles.dismissButton}
              >
                ×
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
