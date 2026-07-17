/**
 * @file frontend/src/context/toast/ToastContext.ts
 */

import { createContext } from "react";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

export interface ToastContextValue {
  // "variant" and "durationMs" both have sensible defaults, so the
  // simplest possible call is just showToast("Item added to cart!")
  showToast: (
    message: string,
    variant?: ToastVariant,
    durationMs?: number,
  ) => void;
  dismissToast: (id: number) => void;
}

export const DEFAULT_DURATION_MS = 4000;

export const ToastContext = createContext<ToastContextValue | null>(null);
