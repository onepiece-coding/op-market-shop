/**
 * @file frontend/src/context/auth/AuthContext.ts
 */

import type { PublicUser, UpdateUserInput } from "@/types/user";
import { createContext } from "react";
import type {
  UserWithMessageResponse,
  SignUpResponse,
  LoginResponse,
  SignUpInput,
  LoginInput,
} from "@/types/auth";

export interface AuthContextValue {
  user: PublicUser | null; // null means "not logged in"
  // true ONLY during our very first "are they already logged in?" check.
  // Route guards (Part 6-B) will wait for this to become false before
  // deciding whether to redirect anyone — this avoids a "flash" where a
  // logged-in user briefly gets bounced to /login before we've even
  // finished checking their session.
  isInitializing: boolean;
  // a small convenience so components don't have to write "user !== null"
  // themselves everywhere — just a derived, read-only shortcut
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<LoginResponse>;
  signUp: (input: SignUpInput) => Promise<SignUpResponse>;
  verifyEmail: (token: string) => Promise<UserWithMessageResponse>;
  logout: () => Promise<void>;
  updateProfile: (input: UpdateUserInput) => Promise<PublicUser>;
}

// starts as null — same pattern as CacheContext in Part 4-A. Any component
// reading this BEFORE our Provider below has mounted would get null.
export const AuthContext = createContext<AuthContextValue | null>(null);
