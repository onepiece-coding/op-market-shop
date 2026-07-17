/**
 * @file frontend/api/ApiError.ts
 */

import type { ValidationErrorDetail } from "@/types/api";

// "extends Error" means ApiError IS a real JavaScript Error, just with two EXTRA
// pieces of information attached: "status" (the HTTP status code, like 404 or 400)
// and "errors" (the field-by-field validation problems, if there were any).
// This lets our components do: if (error instanceof ApiError && error.status === 401) { ... }
export class ApiError extends Error {
  // the HTTP status code that came back, e.g. 400, 401, 404, 500
  status: number;
  // ONLY present when the backend's "validate" middleware rejected the request body
  errors?: ValidationErrorDetail[];

  constructor(
    message: string,
    status: number,
    errors?: ValidationErrorDetail[],
  ) {
    // "super(message)" calls the built-in Error class's own constructor first —
    // this is REQUIRED in TypeScript/JavaScript whenever you extend a built-in class.
    super(message);
    // "name" helps identify this error type when logged to the console
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}
