/**
 * @file frontend/src/hooks/useToast.ts
 */

import { ToastContext, ToastContextValue } from "@/context/toast";
import { useContext } from "react";

// same small wrapper-hook pattern as useAuth() (Part 6-A) and
// useCacheStore() (Part 4-A) — components just call useToast() and get
// a clear error if they forgot to wrap the app in <ToastProvider>
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside a <ToastProvider>");
  }
  return context;
}
