/**
 * @file frontend/src/context/auth/AuthProvider.tsx
 */

import { updateUser as updateUserApi } from "@/api/users";
import { setAuthExpiredHandler } from "@/api/authExpiredHandler";
import { AuthContext, AuthContextValue } from "./AuthContext";
import { type ReactNode, useEffect, useState } from "react";
import type { PublicUser, UpdateUserInput } from "@/types/user";
import { useCacheStore } from "@/hooks";
import type {
  UserWithMessageResponse,
  SignUpResponse,
  LoginResponse,
  SignUpInput,
  LoginInput,
} from "@/types/auth";
import {
  verifyEmail as verifyEmailApi,
  logout as logoutApi,
  signUp as signUpApi,
  login as loginApi,
  getMe,
} from "@/api/auth";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const store = useCacheStore(); // AuthProvider already sits inside CacheProvider in App.tsx

  const [user, setUser] = useState<PublicUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Register our "clear the user" function with apiRequest.ts (Part 3-B),
    // so it can call this the moment it discovers a session has truly died.
    setAuthExpiredHandler(() => {
      setUser(null);
      store.clear();
    });
  }, [store]);

  useEffect(() => {
    // "isMounted" protects us from trying to update state after this
    // component has already been removed from the screen (e.g. the whole
    // app unmounted mid-request during a test, or a fast navigation).
    let isMounted = true;

    getMe()
      .then((me) => {
        if (isMounted) setUser(me);
      })
      .catch(() => {
        // Failing here just means "not logged in" — a totally normal state
        // for a first-time visitor or a truly expired session. We do NOT
        // treat this as an application error; there's nothing to show the
        // user, no error banner needed, we simply know they're logged out.
        if (isMounted) setUser(null);
      })
      .finally(() => {
        if (isMounted) setIsInitializing(false);
      });

    return () => {
      isMounted = false;
    };
  }, []); // empty array: this check should only ever run ONCE, on app start

  async function login(input: LoginInput): Promise<LoginResponse> {
    const response = await loginApi(input);
    setUser(response.user);
    return response;
  }

  async function signUp(input: SignUpInput): Promise<SignUpResponse> {
    // 🚩 Deliberately NOT calling setUser here — signUpCtrl never sets auth
    // cookies (see authController.ts). The user must verify their email
    // first, which is the ONLY path (besides login) that actually logs
    // them in. Calling setUser here would show "Welcome!" UI to someone
    // who still needs to check their inbox — a real, misleading bug.
    const response = await signUpApi(input);
    return response;
  }

  async function verifyEmail(token: string): Promise<UserWithMessageResponse> {
    const response = await verifyEmailApi(token);
    // 🚩 UNLIKE signUp, verifyEmailCtrl DOES set real auth cookies — so we
    // update our shared "user" state here, exactly like login() does, so
    // the rest of the app immediately knows this visitor is now logged in.
    setUser(response.user);
    return response;
  }

  async function logout(): Promise<void> {
    try {
      await logoutApi();
    } finally {
      // "finally" guarantees this runs whether logoutApi() succeeded OR
      // failed (e.g. the user's internet drops right as they click Logout).
      // There's no good reason to keep showing someone as "logged in" once
      // they've clearly asked to log out — we clear them locally regardless.
      setUser(null);
      // wipe cart, orders, addresses, and everything else out of the
      // shared cache — this is what makes the Header's badge (and every
      // other cached view) correctly go blank the instant logout happens,
      // instead of quietly showing the PREVIOUS user's stale data.
      store.clear();
    }
  }

  async function updateProfile(input: UpdateUserInput): Promise<PublicUser> {
    // updateUserCtrl always acts on req.user!.id — there's no id parameter
    // here, because this can ONLY ever update the CURRENTLY logged-in
    // user's own profile, never anyone else's.
    const updatedUser = await updateUserApi(input);
    // 🚩 THE key step from our "why" section: keep AuthContext's shared
    // "user" state in sync, so the Header and every other consumer
    // reflects the change immediately, with no reload needed.
    setUser(updatedUser);
    return updatedUser;
  }

  const value: AuthContextValue = {
    isAuthenticated: user !== null,
    isInitializing,
    updateProfile,
    verifyEmail,
    logout,
    signUp,
    login,
    user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
