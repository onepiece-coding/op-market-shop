/**
 * @file frontend/src/types/auth.ts
 */

import type { PublicUser } from "./user";

// signUpCtrl's exact response shape
export interface SignUpResponse {
  user: PublicUser; // password already stripped out by sanitizeUser() on the backend
  verificationEmailSent: boolean; // true only if Brevo actually accepted the email
  message: string;
}

// loginCtrl's exact response shape — just the user, nothing else.
// (The actual tokens are sent as httpOnly cookies, invisible to our JavaScript —
// this is a GOOD security practice, meaning our frontend code never touches raw tokens.)
export interface LoginResponse {
  user: PublicUser;
}

// verifyEmailCtrl and resetPasswordCtrl both return this same { user, message } shape
export interface UserWithMessageResponse {
  user: PublicUser;
  message: string;
}

// refreshCtrl's response — notice "user" can be null here! If the access token's
// userId no longer matches a real user in the database (e.g. deleted account),
// findUnique returns null, and the controller still sends 200 with { user: null }.
export interface RefreshResponse {
  user: PublicUser | null;
}

// meCtrl sends req.user directly — no wrapper object at all, just the user itself.
export type MeResponse = PublicUser;

// These describe what WE send TO the backend,
// matching each Zod schema in backend/src/schema/userSchema.ts)

// matches signUpSchema exactly: { name, email, password }
export interface SignUpInput {
  name: string;
  email: string;
  password: string;
}

// matches loginSchema exactly: { email, password }
export interface LoginInput {
  email: string;
  password: string;
}

// matches resendVerificationSchema exactly: { email }
export interface ResendVerificationInput {
  email: string;
}

// matches forgotPasswordSchema exactly: { email }
export interface ForgotPasswordInput {
  email: string;
}

// matches resetPasswordSchema exactly: { token, password }
export interface ResetPasswordInput {
  token: string;
  password: string;
}
