/**
 * @file frontend/src/types/api.ts
 */

// This is a "generic type" — the "<T>" is a placeholder for whatever data
// type we plug in later, like PaginatedResponse<Product> or PaginatedResponse<Order>.
// It matches the EXACT shape returned by listProductsCtrl, searchProductsCtrl,
// listAllOrdersCtrl, ListUserOrdersCtrl, and listUsersCtrl.
export interface PaginatedResponse<T> {
  data: T[]; // the array of items for this one page
  pagination: {
    current: number; // which page number we're currently on (starts at 1)
    limit: number; // how many items are shown per page
    totalPages: number; // total number of pages available
    results: number; // total number of items across ALL pages combined
  };
}

// This matches formatZodError()'s output exactly — one entry per invalid field.
export interface ValidationErrorDetail {
  path: string; // which field failed, e.g. "email" or "price" (or "(root)" if not tied to one field)
  message: string; // the human-readable reason it failed, e.g. "Invalid email"
}

// This matches errorHandler's res.json(response) shape in middlewares/error.ts.
// Every failed request (4xx or 5xx) from our backend looks like this.
export interface ApiErrorBody {
  message: string; // always present — a human-readable error summary
  // errors is ONLY present when the failure came from the "validate" middleware
  // (i.e. bad request body). It's undefined for things like 404 "not found" errors.
  errors?: ValidationErrorDetail[];
  // stack is ONLY sent when NODE_ENV !== "production" — never rely on this
  // existing when your app is deployed for real users.
  stack?: string;
}

// A tiny, reusable shape for the many endpoints that JUST send a message back
// (forgotPasswordCtrl, resendVerificationCtrl, logoutCtrl, resetPasswordCtrl's message part, etc.)
export interface MessageResponse {
  message: string;
}
