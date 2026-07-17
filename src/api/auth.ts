/**
 * @file frontend/src/api/auth.ts
 */

// apiRequest is our smart wrapper from Part 3-B — it automatically retries
// once with a fresh token if the server says "your session expired" (401)
import { apiRequest } from "./apiRequest";

// bring in every type we need — both what we SEND and what we RECEIVE
import type {
  SignUpInput,
  SignUpResponse,
  LoginInput,
  LoginResponse,
  ResendVerificationInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  UserWithMessageResponse,
  RefreshResponse,
  MeResponse,
} from "@/types/auth";
import type { MessageResponse } from "@/types/api";

// ---- POST /api/v1/auth/signup ----
// "export async function" means: this function can be imported elsewhere,
// it does its work asynchronously (uses "await" inside), and returns a Promise.
export async function signUp(input: SignUpInput): Promise<SignUpResponse> {
  // apiRequest<SignUpResponse> tells TypeScript "expect this exact shape back"
  return apiRequest<SignUpResponse>("/auth/signup", {
    method: "POST", // matches authRoutes.post("/signup", ...)
    body: input, // apiFetch will JSON.stringify this automatically for us
  });
}

// ---- POST /api/v1/auth/login ----
export async function login(input: LoginInput): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: input,
  });
}

// ---- GET /api/v1/auth/verify-email?token=... ----
export async function verifyEmail(
  token: string,
): Promise<UserWithMessageResponse> {
  // encodeURIComponent makes sure any special characters in the token
  // (like "&" or "+") don't accidentally break the URL's structure
  const safeToken = encodeURIComponent(token);
  return apiRequest<UserWithMessageResponse>(
    `/auth/verify-email?token=${safeToken}`,
    {
      method: "GET", // GET is fetch's default method, but writing it explicitly is clearer to read
    },
  );
}

// ---- POST /api/v1/auth/resend-verification ----
export async function resendVerification(
  input: ResendVerificationInput,
): Promise<MessageResponse> {
  return apiRequest<MessageResponse>("/auth/resend-verification", {
    method: "POST",
    body: input,
  });
}

// ---- POST /api/v1/auth/forgot-password ----
export async function forgotPassword(
  input: ForgotPasswordInput,
): Promise<MessageResponse> {
  return apiRequest<MessageResponse>("/auth/forgot-password", {
    method: "POST",
    body: input,
  });
}

// ---- POST /api/v1/auth/reset-password ----
export async function resetPassword(
  input: ResetPasswordInput,
): Promise<UserWithMessageResponse> {
  return apiRequest<UserWithMessageResponse>("/auth/reset-password", {
    method: "POST",
    body: input,
  });
}

// ---- POST /api/v1/auth/refresh ----
// Most of the time you will NEVER call this yourself — apiRequest.ts already
// calls it automatically behind the scenes when a 401 happens (Part 3-B).
// We still export it for ONE specific use case coming in Part 6: silently
// checking "is this visitor already logged in?" the moment the app first loads,
// using their existing refreshToken cookie (if any) from a previous visit.
export async function refresh(): Promise<RefreshResponse> {
  return apiRequest<RefreshResponse>("/auth/refresh", {
    method: "POST",
  });
}

// ---- POST /api/v1/auth/logout ----
export async function logout(): Promise<MessageResponse> {
  return apiRequest<MessageResponse>("/auth/logout", {
    method: "POST",
  });
}

// ---- GET /api/v1/auth/me ----
export async function getMe(): Promise<MeResponse> {
  return apiRequest<MeResponse>("/auth/me", {
    method: "GET",
  });
}
