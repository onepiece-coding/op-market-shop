/**
 * @file frontend/src/hooks/useAuth.ts
 */

import { AuthContext, AuthContextValue } from "@/context/auth";
import { useContext } from "react";

// same small wrapper-hook pattern as useCacheStore() in Part 4-A — components
// just call useAuth() and get everything, with a clear error if misused.
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an <AuthProvider>");
  }

  return context;
}
